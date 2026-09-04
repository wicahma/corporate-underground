import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

export interface LeakCheckResult {
  leaked: boolean;
  confidence: number; // 0-1
  reason?: string;
}

@Injectable()
export class PrivacyAssistanceService {
  private readonly baseUrl =
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  private readonly model = process.env.LEAK_DETECTION_MODEL || 'qwen2.5:3b';
  private readonly threshold = Number(
    process.env.LEAK_DETECTION_THRESHOLD || '0.7',
  );
  private readonly timeoutMs = 30000;

  private buildPrompt(text: string): string {
    return `Anda adalah pendeteksi kebocoran identitas untuk jejaring sosial anonim perusahaan.
Analisis apakah teks berikut mengandung informasi identitas pribadi (PII) yang dapat mengungkap identitas penulisnya.

Periksa hal-hal berikut:
- Jabatan spesifik yang mempersempit identitas (CTO, VP, lead, manager, dll)
- Frasa unik seperti "saya satu-satunya", "saya sendiri yang", "only developer", "single-handedly"
- Lokasi spesifik (cabang kantor, lantai, gedung)
- Nama tim yang kecil/spesifik
- Alamat email, nomor telepon
- Detail lain yang bisa deanonymize seseorang dalam konteks perusahaan

Rentang teks harus dinilai sebagai berisiko ketika ada informasi yang cukup untuk mengidentifikasi individu tertentu di dalam perusahaan.

Jawab HANYA dengan JSON tanpa teks lain:
{
  "leaked": boolean,
  "confidence": number (0-1, seberapa yakin Anda bahwa ada kebocoran),
  "reason": string (penjelasan singkat dalam Bahasa Indonesia jika leaked=true)
}

Teks yang dianalisis:
"""
${text}
"""`;
  }

  private async callOllama(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.1,
            num_predict: 256,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Ollama returned status ${res.status}`);
      }

      const data = (await res.json()) as { response?: string };
      return data.response || '';
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseAiResponse(raw: string): LeakCheckResult {
    try {
      const parsed = JSON.parse(raw) as {
        leaked?: unknown;
        confidence?: unknown;
        reason?: unknown;
      };

      const leaked = parsed.leaked === true;
      const confidence = Math.max(
        0,
        Math.min(1, Number(parsed.confidence) || 0),
      );

      return {
        leaked,
        confidence,
        reason:
          typeof parsed.reason === 'string' ? parsed.reason : undefined,
      };
    } catch {
      // Fallback: conservative treatment if AI response is unparsable
      return { leaked: true, confidence: 1, reason: 'Analisis AI gagal diproses.' };
    }
  }

  async checkText(text: string): Promise<LeakCheckResult> {
    if (!text || text.trim().length === 0) {
      return { leaked: false, confidence: 0 };
    }

    try {
      const raw = await this.callOllama(this.buildPrompt(text));
      const result = this.parseAiResponse(raw);
      return result;
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'AbortError'
          ? 'Privacy check service timeout, silakan coba lagi.'
          : 'Privacy check service unavailable, silakan coba lagi.';
      throw new HttpException(message, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // Judgment: only treat as leak when AI is confident above threshold
  isLeak(result: LeakCheckResult): boolean {
    return result.leaked && result.confidence >= this.threshold;
  }
}
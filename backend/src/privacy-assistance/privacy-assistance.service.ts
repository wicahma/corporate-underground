import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

export interface LeakCheckResult {
  leaked: boolean;
  confidence: number; // 0-1
  reason?: string;
}

interface RuleHit {
  reason: string;
  confidence: number;
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

  // --- Layer 1: deterministic rules (fast path, no AI needed) ---
  private readonly jobPatterns: { pattern: RegExp; label: string }[] = [
    { pattern: /\b(?:full[- ]stack|front[- ]end|back[- ]end|mobile|web|software|senior|junior|lead|principal|staff|devops|data|cloud|platform|android|ios|game)?\s*(?:developer|engineer|programmer|coder|designer|qa|tester|devops|sre|architect|analyst|scientist|manager|lead)\b/i, label: 'jabatan/spesialisasi' },
    { pattern: /\b(?:cto|ceo|cfo|cmo|coo|vp|director|head of|chief)\b/i, label: 'jabatan eksekutif' },
    { pattern: /\b(?:scrum master|product owner|tech lead|engineering manager|hiring manager|recruiter)\b/i, label: 'peran internal' },
  ];

  private readonly uniquePhrasePatterns: RegExp[] = [
    /\b(?:satu[- ]?satunya|aku yang paling|saya yang paling|hanya saya yang|hanya aku yang|sendiri yang|the only|sole|single[- ]?handedly|orang yang paling|paling senior|paling junior|satu-satunya yang bisa|satu-satunya yang handle)\b/i,
    /\b(?:aku pegang|saya pegang|aku handle|saya handle|aku urus|saya urus)\s+(?:semua|seluruh|semua hal)\b/i,
    /\b(?:sendirian|bertahan sendirian|kerja sendiri)\b/i,
  ];

  private readonly locationPatterns: RegExp[] = [
    /\b(?:kantor|cabang|office|branch|lantai|floor|gedung|building|ruangan|room)\s+[a-z0-9 .-]{2,}/i,
    /\b(?:di\s+)?(?:surabaya|jakarta|bandung|singapore|bali|sydney|london|tokyo|bogor|tangerang|bekasi|depok|semarang|yogyakarta|medan|makassar)\s+(?:kantor|cabang|office|branch|hq|hub)\b/i,
    /\b(?:lantai|floor)\s+\d+/i,
  ];

  private readonly internalDetailPatterns: RegExp[] = [
    /\b(?:tim kami|team kami|anggota tim|jumlah anggota)\s+(?:cuma|hanya|ada|sebanyak)?\s*\d+/i,
    /\btim\s+[a-z0-9_-]{2,}\b/i,
    /\b(?:squad|pod)\b/i,
    /\bgaji|salary|kompensasi|bonus tahunan|thr\b/i,
    /\b(?:atasan|bos|manajer) saya\b/i,
    /\bstandup|sprint|retro|planning\b/i,
  ];

  private readonly contactPatterns: RegExp[] = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/,
    /@[a-z0-9_.]{3,}/i,
  ];

  // --- Layer 2: AI few-shot (catches subtle patterns rules miss) ---
  private buildPrompt(text: string): string {
    return `Anda mendeteksi kebocoran identitas di jejaring sosial anonim perusahaan.
Teks yang menyebut pekerjaan, jabatan, peran, keunikan posisi, detail internal kantor, atau kontak = BOCOR.
Teks opini/curhat umum tanpa semua itu = AMAN.

Contoh:
Teks: "aku sebenarnya full stack developer" -> {"leaked": true, "confidence": 0.95, "reason": "Menyebut jabatan full stack developer, bisa mengidentifikasi penulis di perusahaan kecil"}
Teks: "gabut di rumah, bingung mau ngapain" -> {"leaked": false, "confidence": 0.9, "reason": null}
Teks: "saya CTO di perusahaan ini" -> {"leaked": true, "confidence": 1.0, "reason": "CTO adalah jabatan unik"}
Teks: "hari ini gajian, senangnya" -> {"leaked": false, "confidence": 0.85, "reason": null}
Teks: "makan siang di warteg enak banget" -> {"leaked": false, "confidence": 0.9, "reason": null}
Teks: "aku satu-satunya engineer di sini" -> {"leaked": true, "confidence": 0.95, "reason": "Frasa satu-satunya + jabatan"}
Teks: "keren sih, tapi aku nggak ngerti" -> {"leaked": false, "confidence": 0.95, "reason": null}
Teks: "aku handle semua deploy backend sendiri" -> {"leaked": true, "confidence": 0.95, "reason": "Peran unik: pegang semua deploy"}
Teks: "tim kami cuma 3 orang, gila sibuknya" -> {"leaked": false, "confidence": 0.8, "reason": null}

Ikuti pola contoh. Jangan mengarang indikator yang tidak ada di teks.
Jawab HANYA JSON: {"leaked": boolean, "confidence": number (0-1), "reason": string}

Teks: "${text}"
-> `;
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

  private checkRules(text: string): RuleHit | null {
    const lower = text.toLowerCase();

    for (const { pattern, label } of this.jobPatterns) {
      if (pattern.test(text)) {
        return { reason: `Menyebut ${label} yang bisa mengidentifikasi penulis`, confidence: 0.8 };
      }
    }

    for (const phrase of this.uniquePhrasePatterns) {
      if (phrase.test(lower)) {
        return { reason: 'Frasa keunikan posisi terdeteksi', confidence: 0.85 };
      }
    }

    for (const loc of this.locationPatterns) {
      if (loc.test(text)) {
        return { reason: 'Lokasi/detail tempat kerja disebutkan', confidence: 0.8 };
      }
    }

    for (const detail of this.internalDetailPatterns) {
      if (detail.test(text)) {
        return { reason: 'Detail internal perusahaan disebutkan', confidence: 0.8 };
      }
    }

    for (const contact of this.contactPatterns) {
      if (contact.test(text)) {
        return { reason: 'Kontak (email/telepon/username) terdeteksi', confidence: 0.95 };
      }
    }

    return null;
  }

  async checkText(text: string): Promise<LeakCheckResult> {
    if (!text || text.trim().length === 0) {
      return { leaked: false, confidence: 0 };
    }

    // Layer 1: deterministic rules
    const ruleHit = this.checkRules(text);
    if (ruleHit) {
      return { leaked: true, confidence: ruleHit.confidence, reason: ruleHit.reason };
    }

    // Layer 2: AI few-shot for subtle cases
    try {
      const raw = await this.callOllama(this.buildPrompt(text));
      return this.parseAiResponse(raw);
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
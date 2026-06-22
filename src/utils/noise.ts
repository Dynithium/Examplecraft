/**
 * Seeded 2D Perlin Noise generator in pure TypeScript for Minecraft terrain.
 */

export class SimpleNoise {
  private p: number[] = new Array(512);

  constructor(seedString: string) {
    // Generate deterministic permutation grid based on seed
    const seed = this.hashString(seedString);
    const permutation = Array.from({ length: 256 }, (_, i) => i);
    
    // Shuffle the permutation array deterministically
    let r = seed;
    for (let i = 255; i > 0; i--) {
      r = (r * 9301 + 49297) % 233280;
      const j = Math.floor((r / 233280) * (i + 1));
      const temp = permutation[i];
      permutation[i] = permutation[j];
      permutation[j] = temp;
    }

    // Populate the double permutation array
    for (let i = 0; i < 512; i++) {
      this.p[i] = permutation[i & 255];
    }
  }

  private hashString(str: string): number {
    let hash = 1789;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    // Convert low 4 bits of hash code into 8 gradient directions
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
  }

  /**
   * Get 2D Perlin Noise value between -1 and 1
   */
  public noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];

    const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf));
    const x2 = this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1));

    return this.lerp(v, x1, x2);
  }

  /**
   * Fractional Brownian Motion (multiple octaves of noise)
   */
  public fbm2D(x: number, y: number, octaves: number = 4, lacunarity: number = 2.0, gain: number = 0.5): number {
    let total = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxValue = 0; // Used for normalizing result

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}

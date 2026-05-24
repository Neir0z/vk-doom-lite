export class MusicGenerator {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.bpm = 65;
    this.nextNoteTime = 0;
    this.lookahead = 25;
    this.timerID = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    this._startDrone();
  }

  _startDrone() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, this.ctx.currentTime);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, this.ctx.currentTime);
    filter.Q.value = 8;
    gain.gain.value = 0.4;
    
    osc.connect(filter); filter.connect(gain); gain.connect(this.master);
    osc.start();
  }

  _scheduler() {
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this._playHit(this.nextNoteTime);
      this.nextNoteTime += 60 / this.bpm;
    }
  }

  _playHit(time) {
    // Низкий удар
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(70, time);
    osc.frequency.exponentialRampToValueAtTime(25, time + 0.2);
    g.gain.setValueAtTime(0.7, time);
    g.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    osc.connect(g); g.connect(this.master);
    osc.start(time); osc.stop(time + 0.25);

    // Металлический шум
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0; i<d.length; i++) d[i] = Math.random()*2-1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const ng = this.ctx.createGain();
    const nf = this.ctx.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = 600 + Math.random()*300; nf.Q.value = 3;
    ng.gain.setValueAtTime(0.2, time);
    ng.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    noise.connect(nf); nf.connect(ng); ng.connect(this.master);
    noise.start(time); noise.stop(time + 0.12);
  }

  play() {
    if (this.isPlaying) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.isPlaying = true;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.timerID = setInterval(() => this._scheduler(), this.lookahead);
  }

  stop() {
    this.isPlaying = false;
    clearInterval(this.timerID);
    if (this.ctx) { this.ctx.close(); this.ctx = null; }
  }
}

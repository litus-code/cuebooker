<script setup lang="ts">
defineProps<{
  artistName?: string
  accent?: 'lime' | 'red' | 'violet'
}>()
</script>

<template>
  <div class="cue-fallback" :class="`cue-fallback--${accent || 'lime'}`" aria-hidden="true">
    <div class="cue-fallback__grid" />
    <div class="cue-fallback__orbit cue-fallback__orbit--outer" />
    <div class="cue-fallback__orbit cue-fallback__orbit--inner" />
    <div class="cue-fallback__figure">
      <span class="cue-fallback__head"><i /></span>
      <span class="cue-fallback__torso" />
      <span class="cue-fallback__arm cue-fallback__arm--left" />
      <span class="cue-fallback__arm cue-fallback__arm--right" />
    </div>
    <div class="cue-fallback__scan" />
    <span class="cue-fallback__name">{{ artistName || 'CUE ID' }}</span>
  </div>
</template>

<style scoped>
.cue-fallback {
  --cue-id-accent: #ceff54;
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 43%, color-mix(in srgb, var(--cue-id-accent) 13%, transparent), transparent 30%),
    linear-gradient(145deg, #10130f, #050605 58%, #090a09);
}
.cue-fallback--red { --cue-id-accent: #dc2d28; }
.cue-fallback--violet { --cue-id-accent: #9b7cff; }
.cue-fallback__grid {
  position: absolute;
  inset: 36% -20% -44%;
  opacity: .24;
  background-image: linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);
  background-size: 42px 42px;
  transform: perspective(520px) rotateX(62deg);
}
.cue-fallback__orbit {
  position: absolute;
  left: 50%;
  top: 47%;
  border: 1px solid color-mix(in srgb, var(--cue-id-accent) 35%, transparent);
  border-radius: 50%;
  transform: translate(-50%,-50%) rotateX(70deg);
}
.cue-fallback__orbit--outer { width: 68%; aspect-ratio: 1; opacity: .38; }
.cue-fallback__orbit--inner { width: 44%; aspect-ratio: 1; opacity: .68; }
.cue-fallback__figure {
  position: absolute;
  left: 50%;
  top: 48%;
  width: 154px;
  height: 282px;
  transform: translate(-50%,-50%) rotateY(-10deg);
  filter: drop-shadow(0 28px 36px rgba(0,0,0,.72));
}
.cue-fallback__figure > span { position: absolute; display: block; }
.cue-fallback__head {
  left: 47px;
  top: 0;
  width: 62px;
  height: 72px;
  border-radius: 42% 42% 38% 38%;
  background: linear-gradient(120deg,#4c5148,#111311 46%,#808778 50%,#070807 72%);
  box-shadow: 7px 0 0 color-mix(in srgb,var(--cue-id-accent) 72%,transparent);
}
.cue-fallback__head i {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 31px;
  height: 6px;
  background: var(--cue-id-accent);
  box-shadow: 0 0 18px color-mix(in srgb,var(--cue-id-accent) 55%,transparent);
}
.cue-fallback__torso {
  left: 20px;
  top: 63px;
  width: 116px;
  height: 178px;
  clip-path: polygon(18% 0,82% 0,100% 25%,82% 100%,18% 100%,0 25%);
  background: linear-gradient(122deg,#555b51,#121412 35%,#050605 66%,#2c302a);
  border: 1px solid rgba(255,255,255,.14);
}
.cue-fallback__arm {
  top: 82px;
  width: 28px;
  height: 154px;
  background: linear-gradient(#252924,#080908);
  border: 1px solid rgba(255,255,255,.09);
}
.cue-fallback__arm--left { left: 1px; transform: rotate(8deg); }
.cue-fallback__arm--right { right: 1px; transform: rotate(-8deg); }
.cue-fallback__scan {
  position: absolute;
  left: 16%;
  right: 16%;
  top: 47%;
  height: 1px;
  background: linear-gradient(90deg,transparent,var(--cue-id-accent),transparent);
  box-shadow: 0 0 19px color-mix(in srgb,var(--cue-id-accent) 43%,transparent);
}
.cue-fallback__name {
  position: absolute;
  right: 20px;
  bottom: 18px;
  color: rgba(255,255,255,.48);
  font: 700 9px/1.2 monospace;
  letter-spacing: .13em;
  text-transform: uppercase;
}
@media (prefers-reduced-motion: no-preference) {
  .cue-fallback__scan { animation: cue-fallback-scan 4.8s ease-in-out infinite; }
}
@keyframes cue-fallback-scan {
  0%,100% { transform: translateY(-80px); opacity: .18; }
  50% { transform: translateY(90px); opacity: .85; }
}
</style>

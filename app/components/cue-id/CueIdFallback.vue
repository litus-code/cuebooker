<script setup lang="ts">
defineProps<{
  artistName?: string
  accent?: 'lime' | 'red' | 'violet' | 'white'
}>()
</script>

<template>
  <div class="cue-fallback" :class="`cue-fallback--${accent || 'lime'}`" aria-hidden="true">
    <div class="cue-fallback__grid" />
    <div class="cue-fallback__orbit cue-fallback__orbit--outer" />
    <div class="cue-fallback__orbit cue-fallback__orbit--inner" />

    <div class="cue-fallback__person">
      <span class="cue-fallback__cap"><i /></span>
      <span class="cue-fallback__head" />
      <span class="cue-fallback__neck" />
      <span class="cue-fallback__tank" />
      <span class="cue-fallback__arm cue-fallback__arm--left" />
      <span class="cue-fallback__arm cue-fallback__arm--right" />
      <span class="cue-fallback__cargo cue-fallback__cargo--left"><i /></span>
      <span class="cue-fallback__cargo cue-fallback__cargo--right"><i /></span>
      <span class="cue-fallback__shoe cue-fallback__shoe--left" />
      <span class="cue-fallback__shoe cue-fallback__shoe--right" />
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
    radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--cue-id-accent) 8%, transparent), transparent 27%),
    linear-gradient(145deg, #0d100c, #050605 58%, #090a09);
}
.cue-fallback--red { --cue-id-accent: #dc2d28; }
.cue-fallback--violet { --cue-id-accent: #9b7cff; }
.cue-fallback--white { --cue-id-accent: #ededeb; }
.cue-fallback__grid {
  position: absolute;
  inset: 50% -20% -44%;
  opacity: .16;
  background-image: linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
  background-size: 44px 44px;
  transform: perspective(520px) rotateX(62deg);
}
.cue-fallback__orbit {
  position: absolute;
  left: 50%;
  top: 77%;
  border: 1px solid color-mix(in srgb, var(--cue-id-accent) 35%, transparent);
  border-radius: 50%;
  transform: translate(-50%,-50%) rotateX(70deg);
}
.cue-fallback__orbit--outer { width: 62%; aspect-ratio: 1; opacity: .3; }
.cue-fallback__orbit--inner { width: 42%; aspect-ratio: 1; opacity: .74; }
.cue-fallback__person {
  position: absolute;
  left: 50%;
  top: 52%;
  width: 180px;
  height: 410px;
  transform: translate(-50%,-50%) rotate(-1deg);
  filter: drop-shadow(0 30px 34px rgba(0,0,0,.78));
}
.cue-fallback__person > span { position: absolute; display: block; }
.cue-fallback__head {
  left: 68px;
  top: 31px;
  width: 48px;
  height: 58px;
  border-radius: 44% 44% 48% 48%;
  background: linear-gradient(115deg,#6a625b,#353a35 58%,#151715);
}
.cue-fallback__cap {
  z-index: 2;
  left: 59px;
  top: 15px;
  width: 66px;
  height: 26px;
  border-radius: 48% 48% 16% 16%;
  background: linear-gradient(120deg,#282b28,#090a09 65%);
  transform: rotate(-4deg);
}
.cue-fallback__cap i {
  position: absolute;
  right: -19px;
  bottom: 1px;
  width: 36px;
  height: 5px;
  background: #111311;
  box-shadow: inset 14px 0 0 color-mix(in srgb,var(--cue-id-accent) 72%,transparent);
}
.cue-fallback__neck {
  left: 80px;
  top: 82px;
  width: 24px;
  height: 27px;
  background: #5c554f;
}
.cue-fallback__tank {
  left: 45px;
  top: 103px;
  width: 92px;
  height: 128px;
  clip-path: polygon(18% 0,34% 0,39% 12%,61% 12%,66% 0,82% 0,100% 19%,88% 100%,12% 100%,0 19%);
  background: linear-gradient(105deg,#252825,#0d0f0d 58%,#1a1d1a);
  border-bottom: 2px solid color-mix(in srgb,var(--cue-id-accent) 55%,transparent);
}
.cue-fallback__arm {
  top: 107px;
  width: 22px;
  height: 142px;
  border-radius: 12px;
  background: linear-gradient(#686159,#343833 56%,#181a18);
  transform-origin: 50% 0;
}
.cue-fallback__arm--left { left: 30px; transform: rotate(7deg); }
.cue-fallback__arm--right { right: 25px; transform: rotate(-10deg); }
.cue-fallback__cargo {
  top: 224px;
  width: 48px;
  height: 154px;
  border-radius: 9px 9px 14px 14px;
  background: linear-gradient(100deg,#242724,#0a0b0a 70%);
}
.cue-fallback__cargo--left { left: 42px; transform: rotate(1deg); }
.cue-fallback__cargo--right { right: 37px; transform: rotate(-2deg); }
.cue-fallback__cargo i {
  position: absolute;
  top: 37px;
  width: 17px;
  height: 28px;
  border: 1px solid rgba(255,255,255,.1);
  background: #111311;
}
.cue-fallback__cargo--left i { left: -3px; }
.cue-fallback__cargo--right i { right: -3px; }
.cue-fallback__shoe {
  bottom: 11px;
  width: 58px;
  height: 23px;
  border-radius: 45% 25% 20% 22%;
  background: #0a0b0a;
  border-bottom: 2px solid rgba(255,255,255,.16);
}
.cue-fallback__shoe--left { left: 34px; transform: rotate(-3deg); }
.cue-fallback__shoe--right { right: 27px; transform: rotate(3deg); }
.cue-fallback__scan {
  position: absolute;
  left: 19%;
  right: 19%;
  top: 47%;
  height: 1px;
  background: linear-gradient(90deg,transparent,var(--cue-id-accent),transparent);
  box-shadow: 0 0 18px color-mix(in srgb,var(--cue-id-accent) 38%,transparent);
}
.cue-fallback__name {
  position: absolute;
  right: 22px;
  bottom: 20px;
  color: rgba(255,255,255,.43);
  font: 700 9px/1.2 monospace;
  letter-spacing: .13em;
  text-transform: uppercase;
}
@media (prefers-reduced-motion: no-preference) {
  .cue-fallback__scan { animation: cue-fallback-scan 5.4s ease-in-out infinite; }
}
@keyframes cue-fallback-scan {
  0%,100% { transform: translateY(-125px); opacity: .12; }
  50% { transform: translateY(130px); opacity: .62; }
}
</style>

<script setup lang="ts">
const city = ref('Barcelona')
const date = ref('24 OCT 2026')
const sound = ref('Techno')
const budget = ref(2400)
const discovered = ref(false)
const searching = ref(false)

const nodes = [
  { label: 'BERLIN', type: 'city', x: 12, y: 22 },
  { label: 'ANNA', type: 'artist', x: 33, y: 42 },
  { label: 'BARCELONA', type: 'city', x: 15, y: 76 },
  { label: '24 OCT', type: 'date', x: 68, y: 25 },
  { label: 'NORA', type: 'artist', x: 70, y: 67 },
  { label: 'MADRID', type: 'city', x: 88, y: 82 }
]

async function discover() {
  searching.value = true
  await new Promise((resolve) => setTimeout(resolve, 620))
  searching.value = false
  discovered.value = true
}
</script>

<template>
  <main class="experience-shell">
    <nav class="experience-nav">
      <NuxtLink class="wordmark" to="/">CUEBOOKER<span>/</span></NuxtLink>
      <span class="nav-status"><i /> PRIVATE NETWORK / 01</span>
      <div class="nav-actions"><button>EN</button><button>ES</button><NuxtLink to="/app">ENTER WORKSPACE ↗</NuxtLink></div>
    </nav>

    <section class="doors section-frame">
      <div class="timecode">22:47:16<br /><span>BARCELONA / 41.3874° N</span></div>
      <div class="doors-copy"><p class="kicker">THE BOOKING EXPERIENCE FOR ELECTRONIC MUSIC</p><h1>WHO<br />PLAYS<br /><em>NEXT?</em></h1><p class="subcopy">Discover artists who actually make sense for your date.</p></div>
      <div class="network-stage" :class="{ 'is-discovered': discovered }" aria-label="CueBooker Network visualisation">
        <span class="network-orbit orbit-a" /><span class="network-orbit orbit-b" />
        <svg class="network-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M12 22 L33 42 L15 76 M33 42 L68 25 L70 67 L88 82 M15 76 L70 67" /></svg>
        <span v-for="node in nodes" :key="node.label" class="network-node" :class="`node-${node.type}`" :style="{ left: `${node.x}%`, top: `${node.y}%` }"><i />{{ node.label }}</span>
        <span class="network-readout">{{ searching ? 'SEARCHING...' : discovered ? '12 ARTISTS FOUND' : 'CUEBOOKER NETWORK' }}</span>
      </div>
    </section>

    <section class="search-section section-frame">
      <div class="section-index">01 / DISCOVER</div>
      <div class="search-heading"><p class="kicker">FIND WHO'S ACTUALLY AVAILABLE</p><h2>Make the date<br /><em>make sense.</em></h2></div>
      <div class="search-console">
        <label>WHERE<input v-model="city" aria-label="Where" /></label>
        <label>WHEN<input v-model="date" aria-label="When" /></label>
        <label>SOUND<input v-model="sound" aria-label="Sound" /></label>
        <label>BUDGET <output>€1K — €{{ (budget / 1000).toFixed(1) }}K</output><input v-model="budget" type="range" min="1200" max="5000" step="100" aria-label="Budget" /></label>
        <button class="discover-button" :disabled="searching" @click="discover">{{ searching ? 'SEARCHING...' : 'DISCOVER' }} <span>↗</span></button>
      </div>
      <div class="result-line" :class="{ visible: discovered }"><span>12 ARTISTS AVAILABLE</span><span>{{ city }} / {{ sound }} / {{ date }}</span></div>
    </section>

    <section class="artist-tease section-frame" :class="{ visible: discovered }">
      <div class="section-index">02 / AVAILABLE</div><div><p class="kicker">THE NETWORK ANSWERS</p><h2>Artists for<br /><em>this moment.</em></h2></div>
      <div class="artist-card"><span>01 / 12</span><strong>ANNA<br />REUS</strong><small>TECHNO / HARDGROOVE</small><b>● AVAILABLE 24 OCT</b><a href="/artist">VIEW ARTIST ↗</a></div>
    </section>
  </main>
</template>

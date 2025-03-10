<template>
  <div class="container">
    <h1>Scarica i Comuni delle Province</h1>

    <div v-if="loading">Caricamento...</div>

    <div v-else>
      <div v-for="(provinces, region) in municipalities" :key="region">
        <h2>{{ region }}</h2>
        <div v-for="(municipalityList, province) in provinces" :key="province">
          <input type="checkbox" :id="province" :value="`${region}|${province}`" v-model="selectedProvinces" />
          <label :for="province">{{ province }}</label>
        </div>
      </div>

    </div>

    <button @click="startDownload">Scarica Comuni</button>

    <div v-if="statusMessage">{{ statusMessage }}</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      municipalities: {},
      selectedProvinces: [],
      loading: true,
      statusMessage: ""
    };
  },
  methods: {
    async fetchMunicipalities() {
      try {
        const response = await fetch("/api/all_municipalities");  // Ora passa dal proxy
        const data = await response.json();
        console.log("Dati ricevuti:", data);
        this.municipalities = data;
      } catch (error) {
        this.statusMessage = "Errore di connessione.";
      } finally {
        this.loading = false;
      }
    },
    async startDownload() {
      if (this.selectedProvinces.length === 0) {
        this.statusMessage = "Seleziona almeno una provincia!";
        return;
      }

      this.statusMessage = "📥 Download in corso...";

      // Itera sulle province selezionate e scarica tutti i comuni
      for (const selected of this.selectedProvinces) {
        const [region, province] = selected.split("|"); // Separiamo regione e provincia

        // Verifica se la provincia esiste nei dati caricati
        if (this.municipalities[region] && this.municipalities[region][province]) {
          const municipalities = this.municipalities[region][province];

          for (const municipality of municipalities) {
            await this.downloadFile(region, province, municipality);
          }
        } else {
          console.warn(`Provincia non trovata nei dati: ${region} - ${province}`);
        }
      }

      this.statusMessage = "✅ Download completato!";
    },
    async downloadFile(region, province, municipality) {
      const url = `/api/download/${region}/${province}/${municipality}`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Errore nel download di ${municipality}`);

        // Crea un oggetto blob per il file
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${municipality}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error(error);
      }
    }
  },
  mounted() {
    this.fetchMunicipalities();
  }
};
</script>

<style>
.container {
  max-width: 600px;
  margin: auto;
  text-align: center;
}

button {
  margin-top: 20px;
  padding: 10px;
}
</style>

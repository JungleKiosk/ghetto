<template>
  <div class="container mt-4">
    <h1 class="text-center neon-text">Cadastral INSPIRE</h1>
    <h6 class="text-center mb-4">
      <a href="https://geoinnova.it/" class="neon-link">source</a>
    </h6>

    <div class="row justify-content-center">
      <div class="col-lg-4">
        <!-- 🔍 Barra di ricerca -->
        <div class="text-center mb-4">
          <input type="text" v-model="searchQuery" class="form-control neon-input" placeholder="🔍 Search region..." />
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center">
      <div class="spinner-border neon-spinner" role="status">
        <span class="visually-hidden">Caricamento...</span>
      </div>
    </div>

    <div v-else>
      <div class="row">
        <div v-for="(provinces, region) in filteredRegions" :key="region"
          class="col-6 col-lg-2 col-md-6 col-sm-12 mb-4">
          <div class="card cyber-card">
            <div class="card-body">
              <h5 class="card-title text-center neon-text">{{ region }}</h5>
              <hr class="neon-divider" />
              <div class="province-list">
                <div v-for="(municipalityList, province) in provinces" :key="province" class="form-check">
                  <input type="checkbox" :id="province" :value="`${region}|${province}`" v-model="selectedProvinces"
                    class="form-check-input neon-checkbox" />
                  <label :for="province" class="form-check-label neon-label">{{ province }}</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Messaggio se nessuna regione trovata -->
        <div v-if="filteredRegions.length === 0" class="text-center mt-3">
          <p class="text-danger">⚠️ Nessuna regione trovata.</p>
        </div>
      </div>
    </div>

    <!-- 🚀 Bottone Fisso in Alto a Destra -->
    <button @click="startDownload" class="btn neon-btn fixed-download-btn">
      Download
    </button>

    <!-- 📌 Status Message Fisso sotto il bottone -->
    <div v-if="statusMessage" class="fixed-status-message neon-message">
      {{ statusMessage }}
    </div>

  </div>
</template>

<script>
import JSZip from "jszip";

export default {
  data() {
    return {
      municipalities: {},
      selectedProvinces: [],
      loading: true,
      statusMessage: "",
      searchQuery: "",
    };
  },
  computed: {
    filteredRegions() {
      if (!this.searchQuery) {
        return this.municipalities;
      }
      const query = this.searchQuery.toLowerCase();
      return Object.fromEntries(
        Object.entries(this.municipalities).filter(([region]) =>
          region.toLowerCase().includes(query)
        )
      );
    },
  },
  methods: {
    async fetchMunicipalities() {
      try {
        const response = await fetch("https://iicd.geoinnova.it/all_municipalities");  // URL completo
        const data = await response.json();
        this.municipalities = data;
      } catch (error) {
        this.statusMessage = "⚠️ Errore di connessione.";
      } finally {
        this.loading = false;
      }
    },
    async startDownload() {
      if (this.selectedProvinces.length === 0) {
        this.statusMessage = "⚠️ Seleziona almeno una provincia!";
        return;
      }

      this.statusMessage = "📥 Download in corso...";
      const zip = new JSZip();
      const regionFolders = {};

      for (const selected of this.selectedProvinces) {
        const [region, province] = selected.split("|");
        if (this.municipalities[region] && this.municipalities[region][province]) {
          const municipalities = this.municipalities[region][province];

          if (!regionFolders[region]) {
            regionFolders[region] = zip.folder(region);
          }

          for (const municipality of municipalities) {
            const fileName = `${municipality}.zip`;
            const fileData = await this.downloadFile(region, province, municipality);
            if (fileData) {
              regionFolders[region].file(fileName, fileData);
            }
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });

      const zipLink = document.createElement("a");
      zipLink.href = URL.createObjectURL(zipBlob);
      zipLink.download = "comuni_selezionati.zip";
      document.body.appendChild(zipLink);
      zipLink.click();
      document.body.removeChild(zipLink);

      this.statusMessage = "✅ Download completato!";
    },
    async downloadFile(region, province, municipality) {
      const url = `https://iicd.geoinnova.it/download/${region}/${province}/${municipality}`;  // URL completo

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Errore nel download di ${municipality}`);
        return await response.blob();
      } catch (error) {
        console.error(error);
        return null;
      }
    }
  },
  mounted() {
    this.fetchMunicipalities();
  },
};
</script>

<style>
/* 🌌 Cyberpunk Style */


/* 🌟 Testo Neon */
.neon-text {
  color: #0ff;
  text-shadow: 0 0 10px #0ff, 0 0 20px #00f, 0 0 30px #00f;
}

/* 🔥 Glow effect */
.neon-btn {
  background-color: #083a62;
  border: none;
  color: white;
  box-shadow: 0 0 10px #00aaff, 0 0 20px #00ffd0;
  transition: transform 0.2s ease-in-out;
}

.neon-btn:hover {
  transform: scale(1.1);
}

/* 🟢 Glow per gli input */
.neon-input {
  background-color: #efefef;
  border: 1px solid #00ffcc;
  color: #fff;
  box-shadow: 0 0 10px #00ffcc;
}

/* 🟣 Cards Cyberpunk */
.cyber-card {
  background: linear-gradient(145deg, #121212, #1e1e1e);
  border: 1px solid #00ff44;
  box-shadow: 0 0 10px #00ffaa, 0 0 20px #00d5ff;
}


/* 🔥 Checkbox neon */
.neon-checkbox {
  accent-color: #00ffcc;
  box-shadow: 0 0 5px #00ffcc;
}

.neon-label {
  color: #00ffcc;
}

/* 🚀 Bottone Fisso */
.fixed-download-btn {
  position: fixed;
  top: 15px;
  right: 20px;
  z-index: 1000;
}

/* 📌 Status Message */
.fixed-status-message {
  position: fixed;
  top: 70px;
  right: 20px;
  background: #000;
  color: #0ff;
  border: 1px solid #0ff;
  box-shadow: 0 0 10px #0ff;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
}
</style>

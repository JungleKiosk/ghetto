<template>
  <div class="container">
    <div class="row justify-content-center mt-4">
      <div class="col-12">
        <h1 class="text-center neon-text">Cadastral INSPIRE</h1>
        <h6 class="text-center mb-4">
          <a href="https://geoinnova.it/" class="neon-link">source</a>
        </h6>
      </div>
      <div class="col-4">
        <!-- 🔍 Barra di ricerca -->
        <div class="text-center mb-4">
          <input
            type="text"
            v-model="searchQuery"
            class="form-control neon-input"
            placeholder="🔍 Enter at least 2 letters..."
          />
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
        <div
          v-for="(provinces, region) in filteredRegions"
          :key="region"
          class="col-6 col-lg-2 col-md-6 col-sm-12 mb-4"
        >
          <div class="card cyber-card">
            <div class="card-body">
              <h5 class="card-title text-center neon-text">{{ region }}</h5>
              <hr class="neon-divider" />
              <div class="province-list">
                <div
                  v-for="province in provinces"
                  :key="province"
                  class="form-check"
                >
                  <input
                    type="checkbox"
                    :id="province"
                    :value="`${region}|${province}`"
                    v-model="selectedProvinces"
                    class="form-check-input neon-checkbox"
                  />
                  <label :for="province" class="form-check-label neon-label">{{
                    province
                  }}</label>
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

    <!-- 🚀 Bottone di download -->
    <button @click="startDownload" class="btn neon-btn fixed-download-btn">
      Scarica
    </button>

    <!-- 📌 Status Message -->
    <div v-if="statusMessage" class="fixed-status-message neon-message">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script>
import axios from "axios";
import JSZip from "jszip";

export default {
  data() {
    return {
      municipalities: {}, // Dati delle province e comuni
      selectedProvinces: [], // Province selezionate
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
        this.statusMessage = "🔄 Recupero dati catastali...";

        const url = "/api/wfs";

        const response = await axios.get(url, {
          params: {
            service: "WFS",
            version: "2.0.0",
            request: "GetFeature",
            typename: "CP.CadastralParcel",
            outputFormat: "GML2",
          },
        });

        console.log("Risposta API:", response.data); // 👀 Log della risposta

        const data = response.data;

        // Controlla se `features` esiste nella risposta
        if (!data || !data.features) {
          throw new Error("La risposta API non contiene dati validi!");
        }

        // Mappa i dati in un formato leggibile
        const formattedData = this.formatMunicipalityData(data);
        this.municipalities = formattedData;

        this.statusMessage = "✅ Dati caricati con successo!";
      } catch (error) {
        console.error("Errore nel recupero dei dati:", error);
        this.statusMessage = "⚠️ Errore di connessione o dati non validi!";
      } finally {
        this.loading = false;
      }
    },
    formatMunicipalityData(data) {
      // Converti la risposta API in un formato organizzato per Regione → Provincia → Comune
      let structuredData = {};

      data.features.forEach((feature) => {
        const region = feature.properties.region;
        const province = feature.properties.province;
        const municipality = feature.properties.municipality;

        if (!structuredData[region]) {
          structuredData[region] = {};
        }
        if (!structuredData[region][province]) {
          structuredData[region][province] = [];
        }
        structuredData[region][province].push(municipality);
      });

      return structuredData;
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

        if (
          this.municipalities[region] &&
          this.municipalities[region][province]
        ) {
          const municipalities = this.municipalities[region][province];

          if (!regionFolders[region]) {
            regionFolders[region] = zip.folder(region);
          }

          for (const municipality of municipalities) {
            const fileName = `${municipality}.json`;
            const fileData = JSON.stringify(
              { region, province, municipality },
              null,
              2
            );

            regionFolders[region].file(fileName, fileData);
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });

      const zipLink = document.createElement("a");
      zipLink.href = URL.createObjectURL(zipBlob);
      zipLink.download = "cadastral_data.zip";
      document.body.appendChild(zipLink);
      zipLink.click();
      document.body.removeChild(zipLink);

      this.statusMessage = "✅ Download completato!";
    },
  },
  mounted() {
    this.fetchMunicipalities();
  },
};
</script>

<style>
/* 🌌 Cyberpunk Style */
body {
  background-color: #212121;
  color: #f1f1f1;
  font-family: "Orbitron", sans-serif;
}

.neon-text {
  color: #0ff;
  text-shadow: 0 0 10px #0ff, 0 0 20px #00f, 0 0 30px #00f;
}

.neon-btn {
  background-color: #016bff;
  border: none;
  color: #fff;
  box-shadow: 0 0 10px #00ff7b, 0 0 20px #00d9ff;
}

.fixed-download-btn {
  position: fixed;
  top: 15px;
  right: 20px;
}

.fixed-status-message {
  position: fixed;
  top: 70px;
  right: 20px;
  background: #000;
  color: #0ff;
  padding: 10px;
  border-radius: 5px;
}
</style>

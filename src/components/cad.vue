<template>
  <div class="container mt-4">
    <h1 class="text-center">Cadastral INSPIRE</h1>
    <h6 class="text-center mb-4"><a href="https://geoinnova.it/">source</a></h6>

    <!-- 🔍 Barra di ricerca -->
    <div class="text-center mb-4">
      <input type="text" v-model="searchQuery" class="form-control" placeholder="🔍 Search region..." />
    </div>

    <div v-if="loading" class="text-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Caricamento...</span>
      </div>
    </div>

    <div v-else>
      <div class="row">
        <div v-for="(provinces, region) in filteredRegions" :key="region"
          class="col-6 col-lg-2 col-md-6 col-sm-12 mb-4">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title text-center text-primary">{{ region }}</h5>
              <hr>
              <div class="province-list">
                <div v-for="(municipalityList, province) in provinces" :key="province" class="form-check">
                  <input type="checkbox" :id="province" :value="`${region}|${province}`" v-model="selectedProvinces"
                    class="form-check-input" />
                  <label :for="province" class="form-check-label">{{ province }}</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Messaggio se nessuna regione trovata -->
        <div v-if="filteredRegions.length === 0" class="text-center mt-3">
          <p class="text-muted">⚠️ Nessuna regione trovata.</p>
        </div>
      </div>
    </div>

    <!-- 🚀 Bottone Fisso in Alto a Destra -->
    <button @click="startDownload" class="btn btn-primary btn-lg fixed-download-btn">
      Scarica
    </button>

    <!-- 📌 Status Message Fisso sotto il bottone -->
    <div v-if="statusMessage" class="fixed-status-message">
      {{ statusMessage }}
    </div>

  </div>
</template>



<script>
import JSZip from "jszip";

export default {
  data() {
    return {
      municipalities: {},  // Contiene tutte le regioni e province
      selectedProvinces: [],
      loading: true,
      statusMessage: "",
      searchQuery: "", // 🔍 Stato per la barra di ricerca
    };
  },
  computed: {
    // 🔍 Filtra le regioni in base alla barra di ricerca
    filteredRegions() {
      if (!this.searchQuery) {
        return this.municipalities; // Mostra tutte le regioni se la ricerca è vuota
      }

      const query = this.searchQuery.toLowerCase();
      return Object.fromEntries(
        Object.entries(this.municipalities).filter(([region]) =>
          region.toLowerCase().includes(query)
        )
      );
    }
  },
  methods: {
    async fetchMunicipalities() {
      try {
        const response = await fetch("/api/all_municipalities");
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
        this.statusMessage = "⚠️ Seleziona almeno una provincia!";
        return;
      }

      this.statusMessage = "📥 Download in corso...";
      const zip = new JSZip();

      // Creiamo un oggetto per organizzare i file nelle cartelle corrette
      const regionFolders = {};

      for (const selected of this.selectedProvinces) {
        const [region, province] = selected.split("|");

        if (this.municipalities[region] && this.municipalities[region][province]) {
          const municipalities = this.municipalities[region][province];

          // Creiamo una cartella per la regione solo se non esiste
          if (!regionFolders[region]) {
            regionFolders[region] = zip.folder(region);
          }

          for (const municipality of municipalities) {
            const fileName = `${municipality}.zip`;
            const fileData = await this.downloadFile(region, province, municipality);

            if (fileData) {
              regionFolders[region].file(fileName, fileData); // 📂 Salva solo i comuni della regione corretta
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
      const url = `/api/download/${region}/${province}/${municipality}`;

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
  }
};
</script>

<style>
/* 🔍 Stile per la barra di ricerca */
.form-control {
  max-width: 400px;
  margin: auto;
}

/* 🔹 Stile per il bottone fisso */
.fixed-download-btn {
  position: fixed;
  top: 15px;
  right: 20px;
  z-index: 1000;
  background-color: #007bff;
  color: white;
  border: none;
  padding: 12px 20px;
  font-size: 16px;
  border-radius: 5px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
}

/* 🔥 Effetto Hover */
.fixed-download-btn:hover {
  background-color: #0056b3;
  transform: scale(1.05);
}

/* 📌 Stile per il messaggio di stato fisso */
.fixed-status-message {
  position: fixed;
  top: 70px;
  /* 🔥 Sposta sotto il bottone */
  right: 20px;
  z-index: 999;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #007bff;
  padding: 10px 15px;
  border-radius: 5px;
  font-size: 14px;
  color: #007bff;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  text-align: center;
  font-weight: bold;
  transition: all 0.3s ease-in-out;
}

/* 🟢 Cambia colore in verde se il download è completato */
.fixed-status-message:contains("✅") {
  background-color: rgba(40, 167, 69, 0.9);
  border-color: #28a745;
  color: white;
}

/* 🟡 Cambia colore in giallo se è in corso */
.fixed-status-message:contains("📥") {
  background-color: rgba(255, 193, 7, 0.9);
  border-color: #ffc107;
  color: white;
}

/* 🔴 Cambia colore in rosso se c'è un errore */
.fixed-status-message:contains("⚠️") {
  background-color: rgba(220, 53, 69, 0.9);
  border-color: #dc3545;
  color: white;
}
</style>

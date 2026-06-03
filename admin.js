$(function () {

  let soal = JSON.parse(localStorage.getItem("bankSoal")) || [];
  let editIndex = -1;

  renderSoal();

  // ======================
  // TAMBAH SOAL
  // ======================

$("#btnTambah").click(function () {

  const gambar = $("#gambar").val().trim();
  const jawaban = $("#jawaban").val().trim();
  const kategori = $("#kategori").val();

  if (!gambar || !jawaban) {
    alert("Isi semua field!");
    return;
  }

  // MODE EDIT
  if (editIndex !== -1) {

    soal[editIndex] = {
      gambar,
      jawaban,
      kategori
    };

    editIndex = -1;

    $("#btnTambah")
      .text("➕ Tambah Soal")
      .removeClass("btn-warning")
      .addClass("btn-primary");

    alert("Soal berhasil diupdate!");

  }

  // MODE TAMBAH
  else {

    soal.push({
      gambar,
      jawaban,
      kategori
    });

  }

  simpanSoal();

  $("#gambar").val("");
  $("#jawaban").val("");

  renderSoal();

});

  // ======================
  // RENDER LIST
  // ======================

  function renderSoal() {

    $("#listSoal").empty();

    if (soal.length === 0) {
      $("#listSoal").html("<p>Belum ada soal</p>");
      return;
    }

    soal.forEach((s, i) => {

      $("#listSoal").append(`
        <div class="card p-2 mb-2">

          <img src="${s.gambar}" 
               style="height:100px;object-fit:contain">

          <strong>${s.jawaban}</strong>
          <small>${s.kategori}</small>

          <div class="d-flex gap-2 mt-2">

            <button class="btn btn-warning btn-sm edit"
                    data-index="${i}">
              ✏️ Edit
            </button>

            <button class="btn btn-danger btn-sm hapus"
                    data-index="${i}">
              🗑️ Hapus
            </button>

          </div>

        </div>
      `);

    });

  }

  // ======================
  // HAPUS SOAL
  // ======================

  $(document).on("click", ".hapus", function () {

    const index = $(this).data("index");

    soal.splice(index, 1);

    simpanSoal();
    renderSoal();

  });

  // ======================
  // EDIT SOAL
  // ======================

  $(document).on("click", ".edit", function () {

    const index = $(this).data("index");

    const s = soal[index];

    $("#gambar").val(s.gambar);
    $("#jawaban").val(s.jawaban);
    $("#kategori").val(s.kategori);

    editIndex = index;

    $("#btnTambah")
      .text("💾 Simpan Perubahan")
      .removeClass("btn-primary")
      .addClass("btn-warning");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

  // ======================
  // SIMPAN
  // ======================

  function simpanSoal() {

    localStorage.setItem(
      "bankSoal",
      JSON.stringify(soal)
    );

  }

  // ======================
  // EXPORT JSON
  // ======================

  $("#btnExport").click(function () {

    const dataStr = JSON.stringify(soal, null, 2);

    const blob = new Blob([dataStr], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "soal.json";

    a.click();

  });

  // ======================
  // RESET
  // ======================

  $("#btnReset").click(function () {

    if (confirm("Hapus semua soal?")) {

      soal = [];

      simpanSoal();
      renderSoal();

    }

  });

});
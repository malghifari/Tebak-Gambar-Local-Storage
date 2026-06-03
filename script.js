$(function () {

  // ===== DATA =====
  

  let soal = [];
  // sinkronisasi realtime antar tab
  window.addEventListener("storage", function () {

    const dataBaru = localStorage.getItem("bankSoal");

    if (dataBaru) {

      soal = JSON.parse(dataBaru);

      console.log("Bank soal diperbarui!");

    }

  });
  let index=0, skor=0, lives=3, waktu=15;
  let timerInterval;
  let gameStarted=false, isPaused=false;
  let playerName="";
  let soundOn=true;
  let modeGame = "pilihan"; // "ketik" atau "pilihan"
  let combo = 0;
  let multiplier = 1;
  let kategori = "semua";

  let currentSet = [];

  loadSoal();

  // function loadSoal() {
  //   $.getJSON("soal.json", function(data) {

  //     soal = data;

  //     console.log("Soal berhasil dimuat:", soal);

  //   }).fail(function() {

  //     alert("Gagal memuat soal.json");

  //   });
  // }
  function loadSoal() {

    // ambil dari localStorage admin
    const bankSoal = localStorage.getItem("bankSoal");

    if (bankSoal) {

      soal = JSON.parse(bankSoal);

      console.log("Soal dimuat dari Admin Panel:", soal);

    } else {

      // fallback ke soal.json kalau localStorage kosong
      $.getJSON("soal.json", function(data) {

        soal = data;

        // simpan pertama kali ke localStorage
        localStorage.setItem(
          "bankSoal",
          JSON.stringify(data)
        );

        console.log("Soal default dimuat:", soal);

      }).fail(function() {

        alert("Gagal memuat soal!");

      });

    }

  }

  function setSoalBerdasarkanKategori() {
    if (kategori === "semua") {
      currentSet = shuffle([...soal]);
    } else {
      currentSet = shuffle(
        soal.filter(s => s.kategori === kategori.toLowerCase().trim())
      );
    }
    if (currentSet.length === 0) {
      alert("Soal untuk kategori ini belum tersedia!");
      return;
    }
  }

  function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }

  // ===== SOUND =====
  function playSound(id){
    if(!soundOn) return;
    const s=document.getElementById(id);
    if(s){ s.currentTime=0; s.play(); }
  }

  // ===== TIMER =====
  function startTimer(){
    if(!gameStarted) return;

    clearInterval(timerInterval);
    waktu=15; $("#timer").text(waktu);

    timerInterval=setInterval(()=>{
      if(!gameStarted || isPaused) return;

      waktu--;
      $("#timer").text(waktu);

      if(waktu<=5) $("#timer").addClass("pulse");
      else $("#timer").removeClass("pulse");

      if(waktu<=0){
        lives--; updateLives();
        if(lives<=0) selesaiGame();
        else nextSoal();
      }
    },1000);
  }

  // ===== GAME FLOW =====
  function tampilkanSoal(){
    const s=currentSet[index];
    $("#gambar").hide().attr("src",s.gambar).fadeIn();
    $("#hint").text("Kategori: "+s.kategori);
    $("#jawaban").val("");
    $("#hasil").text("");
    updateProgress();
    startTimer();

    if (modeGame === "pilihan") {
        $("#jawaban, #btnJawab").hide();
        $("#opsiContainer").show();
        generatePilihan();
    } else {
        $("#jawaban, #btnJawab").show();
        $("#opsiContainer").hide();
    }
  }

  function cekJawaban(){
    const input=$("#jawaban").val().toLowerCase().trim();

    if(input===currentSet[index].jawaban){
      playSound("soundBenar");
      skor+=10; updateSkor();

      $(".game-card").addClass("flash-success");
      setTimeout(()=>$(".game-card").removeClass("flash-success"),300);

      // tambah combo
      combo++;

      // hitung multiplier (setiap 3 combo naik)
      multiplier = 1 + Math.floor(combo / 3);

      // skor pakai multiplier
      let poin = 10 * multiplier;
      skor += poin;

      updateSkor();
      updateComboUI();

      // efek visual
      showComboEffect(poin);
      showArcadeCombo();

      nextSoal();
    } else {
      playSound("soundSalah");
      lives--; updateLives();

      $(".game-card").addClass("shake");
      setTimeout(()=>$(".game-card").removeClass("shake"),300);

      combo = 0;
      multiplier = 1;
      updateComboUI();

      if(lives<=0) selesaiGame();
    }
  }

  function nextSoal(){
    index++;
    if(index>=currentSet.length) selesaiGame();
    else tampilkanSoal();
  }

  function selesaiGame(){
    gameStarted=false;
    clearInterval(timerInterval);
    playSound("soundGameOver");

    let high=localStorage.getItem("highScore")||0;
    if(skor>high){ localStorage.setItem("highScore",skor); high=skor; }

    $("#finalScore").text(skor);
    $("#finalHighScore").text(high);
    $("#endTitle").text(lives<=0?"💀 Game Over":"🎉 Kamu Menang!");

    if(lives>0){
      confetti({particleCount:120,spread:70,origin:{y:0.6}});
    }

    $("#gameOverScreen").removeClass("d-none").hide().fadeIn();
    $(".container").fadeOut();
    simpanLeaderboard(playerName, skor);
  }

  // ===== UPDATE UI =====
  function updateProgress(){ $("#progressBar").css("width",(index/currentSet.length)*100+"%"); }
  function updateSkor(){ $("#skor").text(skor); }
  function updateLives(){ $("#lives").text(lives); }

  function gunakanHint(){
    const j=currentSet[index].jawaban;
    $("#hint").text("Hint: huruf awal '"+j[0]+"'");
    skor-=2; updateSkor();
  }

  // ===== PAUSE =====
  function pauseGame(){
    isPaused=true;
    $("#pauseScreen").removeClass("d-none").hide().fadeIn();
  }

  function resumeGame(){
    isPaused=false;
    $("#pauseScreen").fadeOut();
  }

  // ===== START =====
  $(".container").hide();

  $("#btnStartGame").click(function(){
    const nama=$("#playerName").val().trim();
    if(!nama){ alert("Isi nama dulu!"); return; }

    playerName=nama;
    $("#namaPemain").text(playerName);

    soundOn=$("#toggleSound").is(":checked");

    gameStarted=true;
    $("#startScreen").fadeOut();
    $(".container").fadeIn();

    $("#highScore").text(localStorage.getItem("highScore")||0);

    // ambil mode & kategori dulu
modeGame = $("#modeGame").val();
kategori = $("#kategoriGame").val();

// update teks kategori
$("#kategoriText").text(kategori.toUpperCase());

// baru filter soal
setSoalBerdasarkanKategori();

// tampilkan soal
tampilkanSoal();
    if (soal.length === 0) {
      alert("Soal belum selesai dimuat!");
      return;
    }

    // lanjut game...
  });

  // ===== EVENTS =====
  $("#btnJawab").click(()=>{ playSound("soundClick"); cekJawaban(); });
  $("#btnHint").click(()=>{ playSound("soundClick"); gunakanHint(); });
  $("#btnPause").click(()=>{ playSound("soundClick"); pauseGame(); });
  $("#btnResume").click(resumeGame);
  $("#btnMainLagi").click(()=>location.reload());

  $("#jawaban").keypress(function(e){
    if(e.which===13) cekJawaban();
  });

  function generatePilihan() {
        const benar = currentSet[index].jawaban;

        // ambil semua jawaban
        let semuaJawaban = soal.map(s => s.jawaban);

        // acak & ambil 3 pengecoh
        let pengecoh = semuaJawaban
            .filter(j => j !== benar)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        let opsi = [...pengecoh, benar].sort(() => Math.random() - 0.5);

        $("#opsiContainer").empty();

        opsi.forEach(jawaban => {
            $("#opsiContainer").append(`
            <button class="btn btn-outline-primary opsi-btn">${jawaban}</button>
            `);
        });
    }

    $(document).on("click", ".opsi-btn", function () {
        const pilih = $(this).text();
        cekJawabanPilihan(pilih);
    });

    function cekJawabanPilihan(pilih) {

        if (pilih === currentSet[index].jawaban) {
            playSound("soundBenar");

            skor += 10;
            updateSkor();

            $(".game-card").addClass("flash-success");
            setTimeout(() => $(".game-card").removeClass("flash-success"), 300);
            // tambah combo
            combo++;

            // hitung multiplier (setiap 3 combo naik)
            multiplier = 1 + Math.floor(combo / 3);

            // skor pakai multiplier
            let poin = 10 * multiplier;
            skor += poin;

            updateSkor();
            updateComboUI();

            // efek visual
            showComboEffect(poin);
            showArcadeCombo();

            nextSoal();

        } else {
            playSound("soundSalah");

            lives--;
            skor -= 5; // ❗ tambahkan pengurangan skor

            // agar skor tidak negatif
            if (skor < 0) skor = 0;

            combo = 0;
            multiplier = 1;
            updateComboUI();

            updateLives();
            updateSkor();

            $(".game-card").addClass("shake");
            setTimeout(() => $(".game-card").removeClass("shake"), 300);

            if (lives <= 0) {
            selesaiGame();
            }
        }
    }
    
    // focus otomatis ke input nama
    $("#playerName").focus();

    // enter langsung mulai
    $("#playerName").keypress(function(e){
        if(e.which === 13){
            $("#btnStartGame").click();
        }
    });

    function simpanLeaderboard(nama, skor) {
      let data = JSON.parse(localStorage.getItem("leaderboard")) || [];

      data.push({ nama, skor });

      // urutkan dari terbesar
      data.sort((a, b) => b.skor - a.skor);

      // batasi 10 besar
      data = data.slice(0, 10);

      localStorage.setItem("leaderboard", JSON.stringify(data));
    }

    function tampilkanLeaderboard() {
      let data = JSON.parse(localStorage.getItem("leaderboard")) || [];

      $("#leaderboardList").empty();

      if (data.length === 0) {
        $("#leaderboardList").append("<li class='list-group-item text-center'>Belum ada data</li>");
        return;
      }

      data.forEach((item, i) => {
        $("#leaderboardList").append(`
          <li class="list-group-item d-flex justify-content-between">
            <span>${i + 1}. ${item.nama}</span>
            <strong>${item.skor}</strong>
          </li>
        `);
      });
    }

    function resetLeaderboard() {
      localStorage.removeItem("leaderboard");
      tampilkanLeaderboard();
    }

    // buka leaderboard
    $("#btnLeaderboard").click(function () {
      tampilkanLeaderboard();
      $("#leaderboardScreen").removeClass("d-none").hide().fadeIn();
    });

    // tutup
    $("#btnCloseLeaderboard").click(function () {
      $("#leaderboardScreen").fadeOut();
    });

    // reset
    $("#btnResetLeaderboard").click(function () {
      if (confirm("Yakin ingin menghapus semua leaderboard?")) {
        resetLeaderboard();
      }
    });

    function updateComboUI() {
      if (combo > 1) {
        $("#comboText").text(`🔥 Combo x${combo} | Multiplier x${multiplier}`);
      } else {
        $("#comboText").text("");
      }
    }

    function showComboEffect(poin) {
      const el = $(`
        <div class="combo-popup">+${poin}</div>
      `);

      $("body").append(el);

      setTimeout(() => {
        el.addClass("show");
      }, 10);

      setTimeout(() => {
        el.remove();
      }, 1000);
    }

    function showArcadeCombo() {

      let levelClass = "combo-low";

      if (combo >= 6) levelClass = "combo-ultra";
      else if (combo >= 4) levelClass = "combo-high";
      else if (combo >= 2) levelClass = "combo-mid";

      const el = $(`
        <div class="combo-arcade ${levelClass}">
          🔥 COMBO x${combo}<br>
          <small>x${multiplier} MULTIPLIER</small>
        </div>
      `);

      $("body").append(el);

      setTimeout(() => el.addClass("show"), 10);

      setTimeout(() => el.remove(), 900);

      // FLASH EFFECT
      const flash = $('<div class="flash-screen"></div>');
      $("body").append(flash);
      flash.addClass("active");

      setTimeout(() => flash.remove(), 300);

      // CONFETTI kalau combo tinggi
      if (combo >= 5) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.5 }
        });
      }
    }

    if (combo >= 3) {
      playSound("soundCombo");
    }

    $("#kategoriText").text(kategori.toUpperCase());
  // =========================
  // ADMIN PANEL
  // =========================

  const ADMIN_PASSWORD = "admin123";

  // buka popup login
  $("#btnAdmin").click(function () {
    playSound("soundClick");

    $("#adminLogin")
      .removeClass("d-none")
      .hide()
      .fadeIn();

    setTimeout(() => {
      $("#adminPassword").focus();
    }, 200);
  });

  // tutup popup
  $("#btnCloseAdmin").click(function () {
    $("#adminLogin").fadeOut();
  });

  // login admin
  $("#btnMasukAdmin").click(function () {

    const password = $("#adminPassword")
      .val()
      .trim();

    if (password === ADMIN_PASSWORD) {

      playSound("soundBenar");

      window.location.href = "admin.html";

    } else {

      playSound("soundSalah");

      alert("Password admin salah!");

    }

  });

  // enter untuk login
  $("#adminPassword").keypress(function (e) {

    if (e.which === 13) {
      $("#btnMasukAdmin").click();
    }

  });
});
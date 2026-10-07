/* =========================================================
   NIYAINFO Private Limited — site script
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Component details (edit text here) ---------- */
  const PARTS = {
    rfid: {
      qty: "1 per weighbridge (2 for two-way movement)",
      title: "RFID reader",
      img: "assets/photos/rfid-reader.jpg",
      text: "Reads the RFID tag or FASTag pasted on the vehicle's mirror, so the truck is identified automatically. Works at 865 to 867 MHz with a read range of 3 to 6 metres, in a weatherproof IP65 housing."
    },
    sensor: {
      qty: "3 per weighbridge",
      title: "Ultrasonic position sensors",
      img: "assets/photos/position-sensor.jpg",
      text: "Mounted 1500 mm above the platform, these detect the vehicle and confirm that it is correctly positioned during weighment. Sensing range is 200 to 2000 mm with a configurable sonic beam."
    },
    camera: {
      qty: "3 per weighbridge",
      title: "IP cameras C1, C2 and C3",
      img: "assets/photos/front-camera.jpg",
      text: "C1 sits on the tall pole and takes the top view of the load for mineral identification. C2 is a 4 MP varifocal camera that reads the number plate, with an IR illuminator for night. C3 inside the cabin captures the digitizer and the PC screen during weighment."
    },
    controller: {
      qty: "1 per weighbridge",
      title: "Controller",
      text: "An 8-channel isolated I/O unit with MODBUS communication over Ethernet or RTU. It manages the weighbridge hardware, collects every reading and ties it to the application."
    },
    pc: {
      qty: "1 per weighbridge",
      title: "PC and weighbridge digitizer",
      text: "The weight is taken from the digitizer over RS232. The desktop application runs on an Intel i5 10th generation or higher PC with 16 GB RAM and 1 TB storage, which manages the controller and the IoT devices."
    },
    network: {
      qty: "Cabin equipment",
      title: "Network and power",
      text: "An 8+2 port PoE switch connects all Ethernet devices, with a router on a 20 Mbps connection that has a public static IP. Power runs through a distribution unit with an online UPS so a power cut does not stop weighment."
    },
    erawanna: {
      qty: "Software configuration",
      title: "eRawanna integration",
      text: "We configure the site with the Mining Department's eRawanna system so that the vehicle, the weight and the photos are linked to each dispatch automatically."
    }
  };


  const hotspots = document.querySelectorAll(".hotspot");
  const tabs = document.querySelectorAll(".part-tabs button");
  const qtyEl = document.getElementById("part-qty");
  const titleEl = document.getElementById("part-title");
  const textEl = document.getElementById("part-text");
  const imgEl = document.getElementById("part-img");
  const bodyEl = document.querySelector(".part-body");

  function selectPart(key) {
    const part = PARTS[key];
    if (!part) return;
    qtyEl.textContent = part.qty;
    titleEl.textContent = part.title;
    textEl.textContent = part.text;
    if (part.img) {
      imgEl.src = part.img;
      imgEl.alt = part.title + " installed at a weighbridge";
      imgEl.hidden = false;
    } else {
      imgEl.hidden = true;
    }
    bodyEl.classList.toggle("has-img", Boolean(part.img));
    hotspots.forEach(h => h.classList.toggle("active", h.dataset.part === key));
    tabs.forEach(t => t.setAttribute("aria-selected", t.dataset.part === key ? "true" : "false"));
  }

  hotspots.forEach(h => {
    h.addEventListener("click", () => selectPart(h.dataset.part));
    h.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectPart(h.dataset.part); }
    });
  });
  tabs.forEach(t => t.addEventListener("click", () => selectPart(t.dataset.part)));
  selectPart("controller");

  /* ---------- Truck sequence animation ---------- */
  const truck = document.getElementById("truck");
  const beams = [1, 2, 3].map(n => document.getElementById("beam-" + n));
  const cones = [1, 2, 3].map(n => document.getElementById("cone-" + n));
  const led = document.getElementById("led");
  const dataLine = document.getElementById("data-line");
  const steps = document.querySelectorAll(".steps li");
  const playBtn = document.getElementById("play-btn");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let timers = [];
  const wait = (fn, ms) => timers.push(setTimeout(fn, ms));

  function resetScene() {
    timers.forEach(clearTimeout);
    timers = [];
    beams.concat(cones).forEach(el => el.classList.remove("on"));
    led.classList.remove("on");
    dataLine.classList.remove("flow");
    steps.forEach(s => s.classList.remove("lit"));
  }

  function lightStep(i) { if (steps[i]) steps[i].classList.add("lit"); }

  function playSequence() {
    resetScene();

    if (reduceMotion) {
      // Show the final state without movement
      truck.classList.remove("at-start", "at-exit");
      beams.concat(cones).forEach(el => el.classList.add("on"));
      led.classList.add("on");
      steps.forEach(s => s.classList.add("lit"));
      return;
    }

    playBtn.disabled = true;
    truck.classList.remove("at-exit");
    truck.classList.add("at-start");
    // force reflow so the truck jumps back to start before moving
    void truck.getBoundingClientRect();

    wait(() => truck.classList.remove("at-start"), 50);
    wait(() => { selectPart("rfid"); lightStep(0); }, 1400);
    wait(() => { selectPart("sensor"); lightStep(1); }, 2200);
    wait(() => beams[0].classList.add("on"), 2400);
    wait(() => beams[1].classList.add("on"), 2600);
    wait(() => beams[2].classList.add("on"), 2800);
    wait(() => { selectPart("camera"); lightStep(2); cones.forEach(c => c.classList.add("on")); }, 3300);
    wait(() => { cones.forEach(c => c.classList.remove("on")); selectPart("controller"); lightStep(3); led.classList.add("on"); }, 4400);
    wait(() => { selectPart("erawanna"); lightStep(4); dataLine.classList.add("flow"); }, 5200);
    wait(() => { beams.forEach(b => b.classList.remove("on")); truck.classList.add("at-exit"); }, 6500);
    wait(() => {
      dataLine.classList.remove("flow");
      led.classList.remove("on");
      truck.classList.remove("at-exit");
      truck.classList.add("at-start");
      void truck.getBoundingClientRect();
      truck.classList.remove("at-start");
      playBtn.disabled = false;
    }, 8900);
  }

  playBtn.addEventListener("click", playSequence);

  // Play once when the diagram first comes into view
  const diagram = document.getElementById("site-diagram");
  if ("IntersectionObserver" in window && !reduceMotion) {
    truck.classList.add("at-start");
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { playSequence(); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(diagram);
  }

  /* ---------- Mobile navigation ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("open", !open);
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
  }));

  /* ---------- Contact form (opens email app) ---------- */
  const form = document.getElementById("contact-form");
  const errorEl = document.getElementById("form-error");
  const COMPANY_EMAIL = "niyainfo65@gmail.com";

  form.addEventListener("submit", e => {
    e.preventDefault();
    const F = form.elements;
    const name = F.name.value.trim();
    const phone = F.phone.value.trim();
    const site = F.site.value.trim();
    const message = F.message.value.trim();

    F.name.setAttribute("aria-invalid", name ? "false" : "true");
    const phoneOk = /^[+\d][\d\s-]{7,}$/.test(phone);
    F.phone.setAttribute("aria-invalid", phoneOk ? "false" : "true");

    if (!name || !phoneOk) {
      errorEl.textContent = !name
        ? "Enter your name so we know who to contact."
        : "Enter a valid phone number, for example 98765 43210.";
      errorEl.hidden = false;
      (!name ? F.name : F.phone).focus();
      return;
    }
    errorEl.hidden = true;

    const subject = "Weighbridge automation enquiry from " + name;
    const body =
      "Name: " + name + "\n" +
      "Phone: " + phone + "\n" +
      "Location: " + (site || "-") + "\n\n" +
      (message || "");
    window.location.href =
      "mailto:" + COMPANY_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();

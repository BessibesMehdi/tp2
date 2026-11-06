import { createActor } from "xstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { watchMachine } from "./watchMachine";

// Inspecteur Stately affiché dans l'iframe de la page
const inspector = createBrowserInspector({
  iframe: document.querySelector("iframe[data-xstate]"),
});

// Les boutons qui envoient des événements à la machine
const ESC = document.getElementById("ESC");
const SET = document.getElementById("SET");
const UP = document.getElementById("UP");
// L'affichage de l'heure / alarme / timer
const time = document.getElementById("time");
const date = document.getElementById("date");
const alarm = document.getElementById("alarm");
const timer = document.getElementById("timer");

const watchActor = createActor(watchMachine, { inspect: inspector.inspect });

watchActor.subscribe((snapshot) => {
  const show = (states) => (states.some((s) => snapshot.matches(s)) ? "block" : "none");
  time.style.display = show(["NormalMode.Display.Time", "NormalMode.ChangeTime"]);
  date.style.display = show(["NormalMode.Display.Date", "NormalMode.ChangeDate"]);
  alarm.style.display = show(["NormalMode.Display.Alarm", "NormalMode.ChangeAlarm", "Alarm"]);
  timer.style.display = show(["NormalMode.Timer"]);

  const context = snapshot.context;
  time.textContent = context.currentTime.toFormat("hh:mm:ss");
  date.textContent = context.currentTime.toFormat("dd/MM/yyyy");
  alarm.textContent = context.alarmTime.toFormat("hh:mm:ss");
  timer.textContent = context.timer.toFormat("hh:mm:ss");
});

watchActor.start();

ESC.addEventListener("click", () => {
  watchActor.send({ type: "ESC" });
});
SET.addEventListener("click", () => {
  watchActor.send({ type: "SET" });
});
UP.addEventListener("click", () => {
  watchActor.send({ type: "UP" });
});

// On envoie le signal d'horloge à la machine toutes les secondes
setInterval(() => watchActor.send({ type: "CLOCKTICK" }), 1000);

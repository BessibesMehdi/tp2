import { createMachine, createActor } from "xstate";
import { createBrowserInspector } from "@statelyai/inspect";

// Inspecteur Stately affiché dans l'iframe de la page
const inspector = createBrowserInspector({
  iframe: document.querySelector("iframe[data-xstate]"),
});
// Les sous-états du mode normal
const normalSubstates = {
  initial: "orange",
  states: {
    orange: {
      after: {
        3000: { target: "red" },
      },
    },
    red: {
      after: {
        3000: { target: "green" },
      },
    },
    green: {
      after: {
        3000: { target: "orange" },
      },
    },
  },
};
// Les sous-états du mode maintenance
const maintenanceSubstates = {
  initial: "orange",
  states: {
    orange: {
      after: {
        1000: { target: "off" },
      },
    },
    off: {
      after: {
        1000: { target: "orange" },
      },
    },
  },
};

const lightMachine = createMachine({
  id: "french_traffic_lights",
  initial: "off",
  states: {
    off: {
      on: {
        TURNON: "maintenance",
      },
    },
    maintenance: {
      on: {
        GO: "normalOperation",
        TURNOFF: "off",
      },
      ...maintenanceSubstates,
    },
    normalOperation: {
      on: {
        RESET: "maintenance",
        TURNOFF: "off",
      },
      ...normalSubstates,
    },
  },
});


const turnOnButton = document.getElementById("turnOn");
const turnOffButton = document.getElementById("turnOff");
const resetButton = document.getElementById("reset");
const goButton = document.getElementById("go");
const lightsImage = document.getElementById("lights");

const lightActor = createActor(lightMachine, { inspect: inspector.inspect });

lightActor.subscribe((snapshot) => {
  console.log("Current state:", snapshot.value);
  // On change l'image en fonction de l'état
  let image = "/traffic-off.png";
  if (["maintenance.orange", "normalOperation.orange"].some((s) => snapshot.matches(s)))
    image = "/traffic-orange.png";
  if (snapshot.matches("normalOperation.green")) image = "/traffic-green.png";
  if (snapshot.matches("normalOperation.red")) image = "/traffic-red.png";
  lightsImage.src = image;
  // On active ou désactive les boutons en fonction de l'état
  turnOnButton.disabled = !snapshot.can({ type: "TURNON" });
  turnOffButton.disabled = !snapshot.can({ type: "TURNOFF" });
  resetButton.disabled = !snapshot.can({ type: "RESET" });
  goButton.disabled = !snapshot.can({ type: "GO" });
});

lightActor.start();

turnOnButton.addEventListener("click", () => {
  lightActor.send({ type: "TURNON" });
});
turnOffButton.addEventListener("click", () => {
  lightActor.send({ type: "TURNOFF" });
});
resetButton.addEventListener("click", () => {
  lightActor.send({ type: "RESET" });
});
goButton.addEventListener("click", () => {
  lightActor.send({ type: "GO" });
});

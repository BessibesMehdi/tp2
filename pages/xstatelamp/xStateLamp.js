import { setup, createActor } from "xstate";
import { createBrowserInspector } from "@statelyai/inspect";

// Inspecteur Stately affiché dans l'iframe de la page
const inspector = createBrowserInspector({
  iframe: document.querySelector("iframe[data-xstate]"),
});

let count = 0;
const lampMachine = setup({
  actions: {
    turnOn: () => {
      console.log("Turning on!");
      count++;
    },
    turnOff: () => {
      console.log("Turning off!");
    },
  },
}).createMachine({
  id: "lamp",
  initial: "lampOff",
  states: {
    lampOff: {
      on: {
        SWITCH: {
          target: "lampOn",
          actions: ["turnOn"],
        },
      },
    },

    lampOn: {
      on: {
        SWITCH: {
          target: "lampOff",
          actions: ["turnOff"],
        }
      },
    }
  },
});

const lamp = document.getElementById("lamp");
const switchButton = document.getElementById("switch");
const counterText = document.getElementById("counter");

const lampActor = createActor(lampMachine, { inspect: inspector.inspect });

lampActor.subscribe((snapshot) => {
  console.log("Current state:", snapshot.value);
  switch (snapshot.value) {
    case "lampOff":
      lamp.src = "/light_off.gif";
      break;
    case "lampOn":
      lamp.src = "/light_on.gif";
      break;
  }
  counterText.innerHTML = count;
});

lampActor.start();

switchButton.addEventListener("click", () => {
  lampActor.send({ type: "SWITCH" });
});

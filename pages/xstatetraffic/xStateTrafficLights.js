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
  /** @xstate-layout N4IgpgJg5mDOIC5QDMBOYB2BjAFgfQBdUBDZZASyzwBtyocDYA6AezIGIAVAVQCUA5APL8A2gAYAuolAAHFrHIFyLDNJAAPRAE4A7ACYmOgMw6ALAEYAbEatjz5owBoQAT0QOxTLd+8AOXwCsepbmYpZ6AL4RzmiYuIQkZJQ0dAzMALbE5BgEmMTYYOwA4oLiUkggcgpKKmqaCDrmAUwmplpGWnqmeib+zm4IJuZMlj7eYgEmOtZRMejY+ESkFFS09IxMmdm5GPlYhTwCggBix2VqVYrKqhX1ugbGZlY2lnYO-Yi+w3pjvpYB5lMQK0AVmIFiCwSy2SazSmyyOTyBVYJAwMHY6lgBGIuSYpFyqAAFKExGIAJTsCHxJZJVapDZbRG7ZEsVEwc4VS41G6germYJGEZtfy+LRiL7mXQfQYBXxMfw+XyPfmWGbRcHzamJFYpdYZBE7PZgVgcTHY3H4sBEknkymaxbamH0-XbJH7E3IDmyeRXWq3dwCoVaEViiVS1yIGwGcyivxtfkBHSg9VUh3Qul6pgYVmZaiCGRWnHXdi8ACiAGVS5wvZUfdy6ohGs1Wu1Ot1er5pXoAS02n4QTZ2qZk3M4mnabq4dnULn84XuVw+EJTjWudcGw0mi0zK2uj0dH0Iwh+QYtFZVQEQqZRUYwmDU1CJ7CNtPZwWSNyUfl0WaccbLUSt6khSD40jqz7MK+xB5u+RYqF+aJgKudbrv6x5aJYTCSn4B6mGEQT-NKRhGKYTDdH2vg2L4Yg2COGpjo+4HOlmObQXOH7XEw6AQBiWJ-niyAEoSQG2qBjoZlOrEwfOnHcch1SobyiCmEYcp6EqpjWAEFgAomlhESRZFdH4VE0U0972oxTqZlB0kcfBUDoJgvHmv+glWsJpKiZZYHWZJM5sbBn6OWAmDyb6PIaMpqlMOpZhaTpTTTF2gJYTuwavNeB6BFE6rZhAcBqGJ6aTowFwoX6SkIAAtF00rVZYFkMb5EkbGwyDlQplVRQgvjXkwkxmOpphJkYsr6Ue-KCnYqqqqSPQLUYTWQi1pUukyRqdRFG6hGeZF9nYYTxToXZdPKsYmcGCaNSmPniWt8Kusy7qst+YBbfWaH2B0+3jKEljHURVjbsRHTTF8AImMtWolRBj0bSyZAfYpPUOH1sU4S2Z5GBNAxUfKxjEXoaNJqMdHFU+zG2excGRWu3X1HVk3BATfbeJMKkdEtt3NfdcPU0FnGvYhyMM42egpXKY2UUYejdvulGRDzK181TUk05+3Gi5F9SDkw4pmEmOikn8NgGdNxnBvoB4OMO0PjkxNnq4LDlOXTFU64gl7DOYO4AnhvvBBLR5y54gQy3LQS9LLuUREAA */
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

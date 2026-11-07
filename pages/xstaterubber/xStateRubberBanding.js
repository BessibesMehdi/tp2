import Konva from "konva";
import { setup, createActor } from "xstate";
import { createBrowserInspector } from "@statelyai/inspect";

// Inspecteur Stately affiché dans l'iframe de la page
const inspector = createBrowserInspector({
  iframe: document.querySelector("iframe[data-xstate]"),
});

// L'endroit où on va dessiner
const stage = new Konva.Stage({
  container: "container",
  width: 400,
  height: 400,
});

// Une couche pour la ligne en cours de dessin (il peut y en avoir plusieurs)
const temporaire = new Konva.Layer();
// Une couche pour les lignes déjà dessinées
const dessin = new Konva.Layer();
stage.add(dessin);
stage.add(temporaire);

// La ligne en cours de dessin
let rubber;

const rubberBandingMachine = setup({
  actions: {
    // Crée une ligne à la position du clic, les deux points sont confondus
    createLine: () => {
      const pos = stage.getPointerPosition();
      rubber = new Konva.Line({
        // Les points de la ligne sont stockés comme un tableau de coordonnées x,y
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: "red",
        strokeWidth: 2,
      });
      temporaire.add(rubber);
    },
    // Modifie le dernier point de la ligne en cours de dessin
    setLastPoint: () => {
      const pos = stage.getPointerPosition();
      rubber.points([rubber.points()[0], rubber.points()[1], pos.x, pos.y]);
      temporaire.batchDraw();
    },
    // Sauvegarde la ligne
    saveLine: () => {
      rubber.remove(); // On l'enlève de la couche temporaire
      rubber.stroke("blue"); // On change la couleur
      dessin.add(rubber); // On l'ajoute à la couche de dessin
    },
  },
}).createMachine({
  id: "rubberBanding",
  initial: "idle",
  states: {
    idle: {
      on: {
        MOUSECLICK: {
          target: "drawing",
          actions: ["createLine"],
        },
      },
    },
    drawing: {
      on: {
        MOUSEMOVE: {
          actions: ["setLastPoint"],
        },
        MOUSECLICK: {
          target: "idle",
          actions: ["saveLine"],
        },
      },
    },
  },
});

// On démarre la machine
const rubberBandingActor = createActor(rubberBandingMachine, {
  inspect: inspector.inspect,
});
rubberBandingActor.subscribe((snapshot) => {
  console.log("Current state:", snapshot.value);
});
rubberBandingActor.start();

// On transmet les événements souris à la machine
stage.on("click", () => {
  rubberBandingActor.send({ type: "MOUSECLICK" });
});

stage.on("mousemove", () => {
  rubberBandingActor.send({ type: "MOUSEMOVE" });
});

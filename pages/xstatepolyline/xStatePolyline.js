import Konva from "konva";
import { setup, createActor } from "xstate";

const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline; // La polyline en cours de construction

const polylineMachine = setup({
    // Quelques actions et gardes que vous pouvez utiliser dans votre machine
    actions: {
        // Créer une nouvelle polyline
        createLine: () => {
            const pos = stage.getPointerPosition();
            polyline = new Konva.Line({
                points: [pos.x, pos.y, pos.x, pos.y],
                stroke: "red",
                strokeWidth: 2,
            });
            layer.add(polyline);
        },
        // Mettre à jour le dernier point (provisoire) de la polyline
        setLastPoint: () => {
            const pos = stage.getPointerPosition();
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;

            const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
            polyline.points(newPoints.concat([pos.x, pos.y]));
            layer.batchDraw();
        },
        // Enregistrer la polyline
        saveLine: () => {
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;
            // Le dernier point(provisoire) ne fait pas partie de la polyline
            const newPoints = currentPoints.slice(0, size - 2);
            polyline.points(newPoints);
            layer.batchDraw();
        },
        // Ajouter un point à la polyline
        addPoint: () => {
            const pos = stage.getPointerPosition();
            const currentPoints = polyline.points(); // Get the current points of the line
            const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
            polyline.points(newPoints); // Set the updated points to the line
            layer.batchDraw(); // Redraw the layer to reflect the changes
        },
        // Abandonner le tracé de la polyline
        abandon: () => {
            polyline.destroy();
            polyline = null;
            layer.batchDraw();
        },
        // Supprimer le dernier point de la polyline
        removeLastPoint: () => {
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;
            const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
            const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
            polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
            layer.batchDraw(); // Redraw the layer to reflect the changes
        },
    },
    guards: {
        // On peut encore ajouter un point
        NonRempli: () => {
            // Retourner vrai si la polyline a moins de 10 points
            // attention : dans le tableau de points, chaque point est représenté par 2 valeurs (coordonnées x et y)
            return polyline.points().length / 2 < MAX_POINTS;
        },
        // On peut enlever un point (au moins 2 points fixés + 1 provisoire pour ne pas effacer le premier)
        PlusDeDeuxPoints: () => {
            // Deux coordonnées pour chaque point, plus le point provisoire (>= 3 points au total => >= 6)
            return polyline.points().length >= 6;
        },
        // Enregistrer la polyline (2 <= nombre de points <= MAX)
        MinimumDeuxPoints: () => {
            // Au moins 2 points enregistrés + 1 provisoire = 6 coordonnées
            return polyline.points().length >= 6;
        },
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSEyIAjAE4ALEQDMAdhVKlANhV8lfdQA4FAJgA0IAB6JN2ohc1KLF9e6Wu9egL5+NmhYeIREEABOAIYA7gRQ1PTMtABqTPxCSCBoYpLSsvYIpkpEJgCsKp4eldoqmjbyCAqaZUS67Xym6nwqCmVKZQFBGDgExJGx8YmMrBzcGbI5ElIyWYUqem0Kvr58jp5lJg2IpnxEBu3q-V18vhZD2SOh49Fx+AkAQlEAxgDWsMgfmAFlklnlVqBCgBaTQadTwzwKLqmTTqBTo44IKFIzZ6dpKPrqNwWJTwh7BUZhCZvBJMfDiMAREEiXIrAqIFQWUxEMplLqaBREvTuLqY3qbMo7FQVIz9bzkp5jcKvKZMWDfKLIYGCRaiZb5NaIRFEFEWPSeNE9bplTEWZREZqmFTSzx6MpclEBQIgfCoCBwXUhMa61kGyGIKG8uEIu3I1EYuQRlxqZS6J23Oo6DYKoNhUjkEP6iF2RCS2EuYlVbz6PSY5RqLQ6fSGYxmSw5ykvSbvQvg9kIXTnSxlPoo056W6YrStLmeNwDW4T9RevxAA */
    id: "polyLine",
    initial: "idle",
    states: {
        idle: {
            on: {
                MOUSECLICK: {
                    target: "drawing",
                    actions: ["createLine"],
                }
            },
        },

        drawing: {
            on: {
                MOUSEMOVE: {
                    actions: ["setLastPoint"],
                },

                MOUSECLICK: {
                    guard: "NonRempli",
                    actions: ["addPoint"],
                },

                Backspace: {
                    guard: "PlusDeDeuxPoints",
                    actions: ["removeLastPoint"],
                },

                Enter: {
                    guard: "MinimumDeuxPoints",
                    target: "idle",
                    actions: ["saveLine"],
                },

                Escape: {
                    target: "idle",
                    actions: ["abandon"],
                }
            },
        }
    },
});

// On démarre la machine
const polylineActor = createActor(polylineMachine);
polylineActor.subscribe((snapshot) => {
    console.log("Current state:", snapshot.value);
});
polylineActor.start();

// On envoie les événements à la machine
stage.on("click", () => {
    polylineActor.send({ type: "MOUSECLICK" });
});

stage.on("mousemove", () => {
    polylineActor.send({ type: "MOUSEMOVE" });
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineActor.send({ type: event.key });
});

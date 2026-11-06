import { createMachine, assign } from "xstate";
import { DateTime, Duration } from "luxon";

export const watchMachine = createMachine({
    context: {
        alarmTime: DateTime.now().plus({ minutes: 2 }),
        currentTime: DateTime.now(),
        timer: Duration.fromObject({ hours: 0, minutes: 0, seconds: 0 }),
    },
    id: "DigitalWatch",
    initial: "NormalMode",
    on: {
        CLOCKTICK: {
            actions: assign({
                currentTime: ({ context }) => {
                    console.log("CLOCKTICK");
                    return context.currentTime.plus({ seconds: 1 });
                },
            }),
        },
    },
    states: {
        NormalMode: {
            initial: "Display",
            states: {
                Display: {
                    initial: "Time",
                    states: {
                        Time: {
                            on: {
                                ESC: {
                                    target: "Date",
                                },
                                SET: {
                                    target: "#DigitalWatch.NormalMode.ChangeTime",
                                },
                            },
                        },
                        Date: {
                            after: {
                                5000: {
                                    target: "#DigitalWatch.NormalMode.Display.Time",
                                },
                            },
                            on: {
                                ESC: {
                                    target: "Alarm",
                                },
                                SET: {
                                    target: "#DigitalWatch.NormalMode.ChangeDate",
                                },
                            },
                        },
                        Alarm: {
                            after: {
                                5000: {
                                    target: "#DigitalWatch.NormalMode.Display.Time",
                                },
                            },
                            on: {
                                ESC: {
                                    target: "Time",
                                },
                                SET: {
                                    target: "#DigitalWatch.NormalMode.ChangeAlarm",
                                },
                            },
                        },
                    },
                    on: {
                        UP: {
                            target: "Timer",
                        },
                    },
                },
                Timer: {
                    initial: "Stopped",
                    states: {
                        Stopped: {
                            after: {
                                10000: {
                                    target: "#DigitalWatch.NormalMode.Display",
                                },
                            },
                            on: {
                                UP: {
                                    target: "Going",
                                },
                                SET: {
                                    actions: assign({
                                        timer: ({ context }) => {
                                            console.log("resetting timer");
                                            return Duration.fromObject({
                                                hours: 0,
                                                minutes: 0,
                                                seconds: 0,
                                            });
                                        },
                                    }),
                                },
                            },
                        },
                        Going: {
                            on: {
                                UP: {
                                    target: "Stopped",
                                },
                            },
                            after: {
                                1000: {
                                    target: "Going",
                                    actions: assign({
                                        timer: ({ context }) => {
                                            console.log("updating Timer seconds");
                                            return context.timer.plus({ seconds: 1 });
                                        },
                                    }),
                                    reenter: true,
                                },
                            },
                        },
                    },
                    on: {
                        ESC: {
                            target: "Display",
                        },
                    },
                },
                return_where_you_were: {
                    history: "deep",
                    type: "history",
                },
                ChangeTime: {
                    initial: "ChangeHour",
                    states: {
                        ChangeHour: {
                            after: {
                                5000: {
                                    target: "#DigitalWatch.NormalMode.Display.Time",
                                },
                            },
                            on: {
                                SET: {
                                    target: "ChangeMinutes",
                                },
                                UP: {
                                    target: "ChangeHour",
                                    reenter: true,
                                    actions: assign({
                                        currentTime: ({ context }) => {
                                            console.log("updating Hour");
                                            return context.currentTime.plus({hours: 1});
                                        },
                                    }),
                                },
                            },
                        },
                        ChangeMinutes: {
                            after: {
                                5000: {
                                    target: "#DigitalWatch.NormalMode.Display.Time",
                                },
                            },
                            on: {
                                SET: {
                                    target: "ChangeHour",
                                },
                                UP: {
                                    target: "ChangeMinutes",
                                    reenter: true,
                                    actions: assign({
                                        currentTime: ({ context }) => {
                                            console.log("updating Minutes");
                                            return context.currentTime.plus({
                                                minutes: 1,
                                            });
                                        },
                                    }),
                                },
                            },
                        },
                    },
                },
                ChangeDate: {
                    initial: "ChangeMonth",
                    states: {
                        ChangeMonth: {
                            after: {
                                5000: {
                                    target: "#DigitalWatch.NormalMode.Display.Date",
                                },
                            },
                            on: {
                                SET: {
                                    target: "ChangeDay",
                                },
                                UP: {
                                    target: "ChangeMonth",
                                    reenter: true,
                                    actions: assign({
                                        currentTime: ({ context }) => {
                                            console.log("updating Month");
                                            return context.currentTime.plus({months: 1});
                                        },
                                    }),
                                },
                            },
                        },
                        ChangeDay: {
                            after: {
                                5000: {
                                    target: "#DigitalWatch.NormalMode.Display.Date",
                                },
                            },
                            on: {
                                SET: {
                                    target: "ChangeMonth",
                                },
                                UP: {
                                    target: "ChangeDay",
                                    reenter: true,
                                    actions: assign({
                                        currentTime: ({ context }) => {
                                            console.log("updating Day");
                                            return context.currentTime.plus({days: 1});
                                        },
                                    }),
                                },
                            },
                        },
                    },
                },
                ChangeAlarm: {
                    initial: "ChangeHour",
                    states: {
                        ChangeHour: {
                            after: {
                                5000: {
                                    target: "#DigitalWatch.NormalMode.Display.Alarm",
                                },
                            },
                            on: {
                                SET: {
                                    target: "ChangeMinutes",
                                },
                                UP: {
                                    target: "ChangeHour",
                                    reenter: true,
                                    actions: assign({
                                        alarmTime: ({ context }) => {
                                            console.log("updating Alarm hour");
                                            return context.alarmTime.plus({hours: 1});
                                        },
                                    }),
                                },
                            },
                        },
                        ChangeMinutes: {
                            after: {
                                5000: {
                                    target: "#DigitalWatch.NormalMode.Display.Alarm",
                                },
                            },
                            on: {
                                SET: {
                                    target: "ChangeHour",
                                },
                                UP: {
                                    target: "ChangeMinutes",
                                    reenter: true,
                                    actions: assign({
                                        alarmTime: ({ context }) => {
                                            console.log("updating Timer minutes");
                                            return context.alarmTime.plus({ minutes: 1});
                                        },
                                    }),
                                },
                            },
                        },
                    },
                },                
            },
            on: {
                AlarmTime: {
                    target: "#DigitalWatch.Alarm",
                },
            },
        },
        Alarm: {
            after: {
                5000: {
                    target: "#DigitalWatch.NormalMode.return_where_you_were",
                },
            },
        },
    },
});

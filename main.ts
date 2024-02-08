
interface IActionVector {
    _key: state
    _oldkey: state
    _action: Action
}


enum state {
    state1 = 0x10,
    state2 = 0x11,
    state3 = 0x20,
    state4 = 0x21
}

enum GroundSensorDetected {
    //% block="none"
    None = 0,
    //% block="right"
    Right = 1,
    //% block="left"
    Left = 2,
    //% block="left and right"
    Both = 3,
}

enum IrRemoteButton {
    PowerOff = 0,
    Up = 1,
    PowerOn = 2,
    Left = 4,
    Center = 5,
    Right = 6,
    Back = 8,
    Down = 9,
    Next = 10,
    Plus = 12,
    Zero = 13,
    Minus = 14,
    One = 16,
    Two = 17,
    Three = 18,
    Four = 20,
    Five = 21,
    Six = 22,
    Seven = 24,
    Eight = 25,
    Nine = 26
};

/**
 * GameBot
 */
//% block="BrainBot"
//% weight=70 icon="\uf1b9" color=#EC7505
//% groups='["Wheels", "Lights", "Sound", "Sensors", "Receiver"]'
namespace brainbot {
    export enum TurnDirection {
        //% blockId="patrolLeft" block="left"
        Left = 0x10,
        //% blockId="patrolRight" block="right"
        Right = 0x20,
    }

    export enum MoveDirection {
        //% blockId="patrolLeft" block="forward"
        Forward = 0x10,
        //% blockId="patrolRight" block="back"
        Back = 0x20,
    }

    export enum Voltage {
        //%block="found"
        High = 0x01,
        //% block="lost"
        Low = 0x00
    }

    let init_ir: boolean = false
    let groundSensorCallback: IActionVector[] = []

    let taillightLeftcolor: number;
    let taillightRightColor: number;

    /**
     * Move forward or backward
     */
    //% blockId=brainbot_move block="Move %movedirection speed %speed"
    //% speed.min=0 speed.max=100 speed.defl=50
    //% group="Wheels"
    //% weight=99
    export function Move(movedirection: MoveDirection, speed: number): void {

        if (movedirection == MoveDirection.Forward)
            MoveCustom(speed, speed);
        else
            MoveCustom(speed * -1, speed * -1);
    }

    /**
     * Turn left or right
     */
    //% blockId=brainbot_Turn block="Turn %turndirection speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=50
    //% group="Wheels"
    //% weight=98
    export function Turn(turndirection: TurnDirection, speed: number): void {

        if (turndirection == TurnDirection.Left)
            MoveCustom(0, speed);
        else
            MoveCustom(speed, 0);
    }

    /**
     * Spin left or right
     */
    //% blockId=brainbot_Spin block="Spin %turndirection speed %speed"
    //% speed.min=-100 speed.max=100 speed.defl=50
    //% group="Wheels"
    //% weight=97
    export function Spin(turndirection: TurnDirection, speed: number): void {

        if (turndirection == TurnDirection.Left)
            MoveCustom(speed * -1, speed);
        else
            MoveCustom(speed, speed * -1);
    }

    /**
     * Move
     */
    //% blockId=brainbot_movecustom block="Move left speed %leftspeed right speed %rightspeed"
    //% leftspeed.min=-100 leftspeed.max=100 leftspeed.defl=50
    //% rightspeed.min=-100 rightspeed.max=100 rightspeed.defl=50
    //% group="Wheels"
    //% weight=96
    export function MoveCustom(leftspeed: number, rightspeed: number): void {
        let deviceAddress = 0x1;


        let left = Math.map(leftspeed, -100, 100, -255, 255);
        let right = Math.map(rightspeed, -100, 100, -255, 255);
        let data: number[] = []

        data = [0x2, 0, 0, 0, 0];

        if (left > 0) {
            data[1] = left;
            data[2] = 0x00;
        }
        else {
            left *= -1
            data[1] = 0;
            data[2] = left;
        }

        if (right > 0) {
            data[3] = right;
            data[4] = 0x00;
        }
        else {
            right *= -1
            data[3] = 0;
            data[4] = right;
        }


        for (let i = 0; i < 5; i++) {
            pins.i2cWriteNumber(
                deviceAddress,
                data[i],
                NumberFormat.Int8LE,
                i < 4 ? true : false
            );
        }
    }

    //% blockId=brainbot_stop block="Stop"
    //% group="Wheels"
    //% weight=95
    export function Stop(): void {
        let deviceAddress = 0x1;
        let data: number[] = [0x2, 0, 0, 0, 0]

        for (let i = 0; i < 5; i++) {
            pins.i2cWriteNumber(
                deviceAddress,
                data[i],
                NumberFormat.Int8LE,
                i < 4 ? true : false
            );
        }

    }


    //% blockId=brainbot_beep block="Beep"
    //% group="Sound"
    export function Beep(): void {
        pins.P0.analogWrite(512)
        pins.P0.analogSetPeriod(1000)
        pause(100);
        pins.P0.analogWrite(0)
    }

    //% blockId=brainbot_sound block="set sound %on=toggleOnOff"
    //% group="Sound"
    export function Sound(on: boolean): void {
        if (on) {
            pins.P0.analogWrite(512)
            pins.P0.analogSetPeriod(1000)
        }

        else
            pins.P0.analogWrite(0)
    }

    //% blockId=brainbot_headlight_color block="Set headlight color to %color"	
    //% group="Lights"
    //% weight=99
    //% color.defl=255
    export function HeadlightColor(color: number): void {
        let red = (color >> 16) & 0xFF;
        let green = (color >> 8) & 0xFF;
        let blue = (color >> 0) & 0xFF;
        let deviceAddress = 0x1;
        let data: number[] = [0x1, red, green, blue];

        for (let i = 0; i < 4; i++) {
            pins.i2cWriteNumber(
                deviceAddress,
                data[i],
                NumberFormat.Int8LE,
                i < 3 ? true : false
            );
        }

    }




    //% blockId=brainbot_taillight_color block="Set taillight %direction color to %color"
    //% group="Lights"
    //% weight=95
    //% color.defl=255
    export function TaillightColor(direction: TurnDirection, color: number): void {
        let strip: neopixel.Strip = null
        strip = neopixel.create(DigitalPin.P12, 2, NeoPixelMode.RGB)

        if (direction == TurnDirection.Left)
            taillightLeftcolor = color;
        else
            taillightRightColor = color;

        strip.setPixelColor(0, neopixel.colors(taillightLeftcolor))
        strip.setPixelColor(1, neopixel.colors(taillightRightColor))
        strip.show()
    }

    function packRGB(a: number, b: number, c: number): number {
        return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF);
    }

    /**
     * Converts red, green, blue channels into a RGB color
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% weight=1
    //% blockId="brainbot_rgb" block="red %red|green %green|blue %blue" 
    //% group="Lights"	
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }

    /**
     * Gets the RGB value of a known color
    */
    //% weight=2 blockGap=8
    //% blockId="brainbot_colors" block="%color" 
    //% group="Lights"	
    export function colors(color: NeoPixelColors): number {
        return color;
    }


    /**
    * Line tracking sensor event function
    */
    //% weight=2
    //% blockId=brainbot_gndsensor_event block="on|%direction line tracking sensor|%vi"
    //% group="Sensors"
    export function onGroundSensorEvent(direction: TurnDirection, vi: Voltage, a: Action) {
        let state = direction + vi;
        let item: IActionVector = { _key: state, _oldkey: 0, _action: a };
        groundSensorCallback.push(item);
    }

    let groundSensorValue: number
    let groundSensorScanIdx: number = 1;
    function GetGroundSensorState(): number {
        switch (groundSensorScanIdx) {
            case 1: groundSensorValue = pins.digitalReadPin(DigitalPin.P13) == 0 ? state.state1 : 0; break;
            case 2: groundSensorValue = pins.digitalReadPin(DigitalPin.P13) == 1 ? state.state2 : 0; break;
            case 3: groundSensorValue = pins.digitalReadPin(DigitalPin.P14) == 0 ? state.state3 : 0; break;
            case 4: groundSensorValue = pins.digitalReadPin(DigitalPin.P14) == 1 ? state.state4 : 0; break;

        }
        groundSensorScanIdx += 1;
        if (groundSensorScanIdx == 5) groundSensorScanIdx = 1;

        return groundSensorValue;
    }


    /**
     * Ground sensor detected
    */
    //% weight=2 blockGap=8
    //% blockId="brainbot_groundsensor_detected" block="line detected |%detect" 
    //% group="Sensors"	
    export function ReadGroundSensor(detect: GroundSensorDetected): boolean {
        switch (detect) {
            case GroundSensorDetected.None:
                return pins.digitalReadPin(DigitalPin.P13) == 0 && pins.digitalReadPin(DigitalPin.P14) == 0

            case GroundSensorDetected.Right:
                return pins.digitalReadPin(DigitalPin.P14) > 0 && pins.digitalReadPin(DigitalPin.P13) == 0

            case GroundSensorDetected.Left:
                return pins.digitalReadPin(DigitalPin.P13) > 0 && pins.digitalReadPin(DigitalPin.P14) == 0

            case GroundSensorDetected.Both:
                return pins.digitalReadPin(DigitalPin.P13) > 0 && pins.digitalReadPin(DigitalPin.P14) > 0

        }

        return false
    }


    //% blockId=brainbot_distancesensor block="read distance"
    //% group="Sensors"
    export function ReadDistanceSensor(): number {
        let distance = sonar.ping(
            DigitalPin.P16,
            DigitalPin.P15,
            PingUnit.Centimeters
        );
        return distance;
    }

    let irReceived: number
    let irKeyCallback: IActionVector[] = []
    let lastkey: number

    /**
    * button pushed.
    */
    //% blockId=brainbot_infrared received_event
    //% block="on receiver button |%btn| pressed"
    //% group="Reciever"
    //% weight=97
    export function onPressEvent(btn: IrRemoteButton, body: Action): void {
        if (init_ir == false) {
            makerbit.connectIrReceiver(DigitalPin.P8, IrProtocol.NEC)

            init_ir = true
            irReceived = 0

            makerbit.onIrButton(IrButton.Any, IrButtonAction.Pressed, function () {
                irReceived = 1
            })
        }

        let bt = btn as number
        let item: IActionVector = { _key: bt, _oldkey: bt, _action: body };

        irKeyCallback.push(item)
    }


    //% blockId=brainbot_read_infrared block="read last infrared key"
    //% group="Reciever"
    //% weight=99
    export function ReadLastKey(): number {
        if (init_ir == false) {
            makerbit.connectIrReceiver(DigitalPin.P8, IrProtocol.NEC)

            init_ir = true
            irReceived = 0

            makerbit.onIrButton(IrButton.Any, IrButtonAction.Pressed, function () {
                irReceived = 1
            })
        }

        return lastkey;
    }


    function GetIrKey(): number {
        if (irReceived == 0) {
            return 100;
        }

        irReceived = 0 // reset

        let key = makerbit.irButton();
        let keyConvert = 100;

        switch (key) {
            case 0: // power on
                keyConvert = 0;
                break
            case 128: // up
                keyConvert = 1;
                break
            case 64: // power off
                keyConvert = 2;
                break
            case 32: // left
                keyConvert = 2;
                break
            case 160: // center
                keyConvert = 5;
                break
            case 96: // right
                keyConvert = 6;
                break
            case 16: // back
                keyConvert = 8;
                break
            case 144: // down
                keyConvert = 9;
                break
            case 80: // next
                keyConvert = 10;
                break
            case 48: // +
                keyConvert = 12;
                break
            case 176: // 0
                keyConvert = 13;
                break
            case 112: // -
                keyConvert = 14;
                break
            case 8: // 1
                keyConvert = 16;
                break
            case 136: // 2
                keyConvert = 17;
                break
            case 72: // 3
                keyConvert = 18;
                break
            case 40: // 4
                keyConvert = 20;
                break
            case 168: // 5
                keyConvert = 21;
                break
            case 104: // 6
                keyConvert = 22;
                break
            case 24: // 7
                keyConvert = 24;
                break
            case 152: // 8
                keyConvert = 25;
                break
            case 88: // 9
                keyConvert = 26;
                break
        }

        lastkey = keyConvert;
        return keyConvert;
    }

    forever(() => {
        if (groundSensorCallback != null) {
            let sta = GetGroundSensorState();
            if (sta != 0) {
                for (let item of groundSensorCallback) {
                    if (item._key == sta /*&& item._key != item._oldkey*/) {
                        item._action();
                    }

                    //if ((item._key && 0x30) == (item._oldkey && 0x30))
                    //    item._oldkey = item._key
                }
            }
        }

        if (irKeyCallback != null) {
            let key = GetIrKey();

            if (key != 100) {
                for (let item of irKeyCallback) {
                    if (item._key == key) {
                        item._action();
                    }
                }
            }


        }
        pause(25);
    })


}
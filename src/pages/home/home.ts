import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BLE } from '@ionic-native/ble';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [BLE, BluetoothSerial]
})
export class HomePage {

  public devices: Array<any> = [];
  public status: string = "";

  constructor(private ble: BLE,
    public navCtrl: NavController,
    private bluetoothSerial: BluetoothSerial) {
  }

  public scan() {
    this.bluetoothSerial.list().then(
      data => {
        console.log(data)
        this.devices = data;
      },
      err => {
        console.log(err);
      }
    )
  }

  public connect(item) {
    if (!item) {
      return;
    }
    console.log(item);
    this.bluetoothSerial.connect(item.address).subscribe(
      device => {
        console.log("connected: ", device);
        this.status = `connected: ${device.name}`;
        this.bluetoothSerial.subscribeRawData().subscribe((data) => {
          console.log("Subscription : " + JSON.stringify(data));
          this.bluetoothSerial.read().then((data) => { console.log("read data : " + JSON.stringify(data)) });
        });
      },
      err => {
        console.log("error on connect: ", err);
      }
    )
  }

  // public listen() {
  //   this.bluetoothSerial.subscribe('\n').subscribe(
  //     data => {
  //       console.log('subscribe', data);
  //     },
  //     err => {
  //       console.log('err', err);
  //     }
  //   );
  // }

  // public listenRawData() {
  //   this.bluetoothSerial.subscribeRawData().subscribe(
  //     data => {
  //       console.log('subscribeRawData', data);
  //     },
  //     err => {
  //       console.log('error subscribeRawData', err);
  //     }
  //   );
  // }

  // public read() {
  //   this.bluetoothSerial.read().then(
  //     data => {
  //       console.log('read', data);
  //     },
  //     err => {
  //       console.log('err', err);

  //     }
  //   )
  // }

  public openInterface() {
    // Typed Array
    let data = new Uint8Array(8);
    data[0] = 0x0d;
    data[1] = 0x0a;
    data[2] = 0x0d;
    data[3] = 0x0a;
    data[4] = 0x0d;
    data[5] = 0x0a;
    data[6] = 0x0d;
    data[7] = 0x0a;

    let data2 = new Uint8Array(8);
    data2[0] = 0x0d;
    data2[1] = 0x0d;
    data2[2] = 0x0d;
    data2[3] = 0x0d;
    data2[4] = 0x0d;
    data2[5] = 0x0d;
    data2[6] = 0x0d;
    data2[7] = 0x0d;

    this.bluetoothSerial.write(data2).then(
      data => {
        console.log('open interface', data);
        this.bluetoothSerial.subscribe('\n').subscribe(
          data => {
            console.log('iter interface', data);
            this.bluetoothSerial.subscribeRawData().subscribe((data) => {
              console.log("iter : " + JSON.stringify(data));
              this.bluetoothSerial.read().then((data) => { console.log("iter data : " + JSON.stringify(data)) });
            });
          },
          err => {
            console.log('err interface', err);
          }
        );
      },
      err => {
        console.log('err', err);

      }
    )
  }

  public str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  public getBatteryLevel() {

    this.bluetoothSerial.write("Br.batt").then(
      data => {
        console.log('Br.batt', data);
        this.bluetoothSerial.subscribe('\n').subscribe(
          data => {
            console.log('subscribe Br.batt', data);
            this.bluetoothSerial.subscribeRawData().subscribe((data) => {
              console.log("iter : " + JSON.stringify(data));
              this.bluetoothSerial.read().then((data) => { console.log("iter data : " + JSON.stringify(data)) });
            });
          },
          err => {
            console.log('err Br.batt', err);
          }
        );
      },
      err => {
        console.log('err Br.batt 2', err);

      }
    )
  }

  public getVersion() {
    this.bluetoothSerial.write('ver').then(
      data => {
        console.log('ver', data);
        this.bluetoothSerial.subscribeRawData().subscribe((data) => {
          console.log("iter : " + JSON.stringify(data));
          this.bluetoothSerial.read().then((data) => { console.log("iter data : " + JSON.stringify(data)) });
        });
      },
      err => {
        console.log('err', err);
      }
    )
  }



  public dataAvaiable() {
    this.bluetoothSerial.available().then(
      data => {
        console.log('dataAvaiable', data);
        this.bluetoothSerial.subscribeRawData().subscribe((data) => {
          console.log("iter : " + JSON.stringify(data));
          this.bluetoothSerial.read().then((data) => { console.log("iter data : " + JSON.stringify(data)) });
        });
      },
      err => {
        console.log('err', err);
      }
    )
  }



}

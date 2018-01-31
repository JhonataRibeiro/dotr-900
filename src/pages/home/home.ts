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
  public tags: Array<any> = [];
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

  public openInterface() {
    let data = new Uint8Array(8);
    data[0] = 0x0d;
    data[1] = 0x0d;
    data[2] = 0x0d;
    data[3] = 0x0d;
    data[4] = 0x0d;
    data[5] = 0x0d;
    data[6] = 0x0d;
    data[7] = 0x0d;

    this.bluetoothSerial.write(data).then(
      data => {
        console.log('open interface', data);
      },
      err => {
        console.log('err', err);
      }
    )
  }

  private subscriber(data: any) {
    console.log('subscriber function', data);
    this.bluetoothSerial.subscribeRawData().subscribe((data) => {
      console.log("Subscription : " + JSON.stringify(data));
      this.bluetoothSerial.read().then((data) => { console.log("subscriber data function : " + JSON.stringify(data)) });
    });
  }

  public getBatteryLevel() {
    this.bluetoothSerial.write("Br.batt").then(
      data => {
        console.log('Br.batt', data);
        this.openInterface();
        // this.dataAvaiable();
        // this.bluetoothSerial.subscribe('\n').subscribe(
        //   data => {
        //     this.subscriber(data);
        //   },
        //   err => {
        //     console.log('err interface', err);
        //   }
        // );
      },
      err => {
        console.log('err Br.batt 2', err);

      }
    )
  }

  // set 1 to start beep 0 to stop beep
  public disableBeep(param) {
    console.log('param: ', param);
    this.bluetoothSerial.write(`Br.beep,${param ? 1 : 0}`).then(
      data => {
        console.log('deactiveBeep ============================================' + data);
      },
      err => {
        console.log('err ' + err);
      }
    )
  }

  public toggleTeste(param) {
    console.log(param);
  }

  public getVersion() {
    this.bluetoothSerial.write('ver').then(
      data => {
        console.log('ver', data);
        this.bluetoothSerial.subscribeRawData().subscribe((data) => {
          console.log("iter : " + JSON.stringify(data));
          this.bluetoothSerial.read().then((data) => { console.log("version data : " + JSON.stringify(data)) });
        });
      },
      err => {
        console.log('err', err);
      }
    )
  }

  public getInventory() {
    this.bluetoothSerial.write('I').then(
      data => {
        console.log('I', data);
        this.bluetoothSerial.subscribeRawData().subscribe((data) => {
          this.bluetoothSerial.read().then((data) => {
            console.log("pure data : ", data)
            let tagId = JSON.stringify(data);
            console.log("get invertory data : " + tagId);
            this.findIndexByTag(tagId,data=>{
              console.log('in array: ', data);
              // this.tags.push(tagId);
            })
          });
        });
      },
      err => {
        console.log('err', err);
      }
    )
  }

  public findIndexByTag(element,cb) {
    let tagInArray = false;
    for (var i = 0; i < this.devices.length; i++) {
      if (this.devices[i] === element) tagInArray = true;
    }
    cb(tagInArray);
  }

  public info(tag) {
    console.log("info for tag: ", tag);

  }

  //Stop em qualquer coisa que esteja fazendo;
  public stop() {
    this.bluetoothSerial.write('s').then(
      data => {
        console.log('s', data);
        this.bluetoothSerial.subscribeRawData().subscribe((data) => {
          this.bluetoothSerial.read().then((data) => {
            console.log("pure data : ", data)
            console.log("get invertory data : " + JSON.stringify(data))
          });
        });
      },
      err => {
        console.log('err', err);
      }
    )
  }

  //Stop em qualquer coisa que esteja fazendo;
  public writeTag() {
    this.bluetoothSerial.write("w,16,2,5,mesa").then(
      data => {
        console.log('s', data);
        this.bluetoothSerial.subscribeRawData().subscribe((data) => {
          this.bluetoothSerial.read().then((data) => {
            console.log("pure data : ", data)
            console.log("get invertory data : " + JSON.stringify(data))
          });
        });
      },
      err => {
        console.log('err', err);
      }
    )
  }

  //Stop em qualquer coisa que esteja fazendo;
  public sendReader() {
    this.bluetoothSerial.write('s').then(
      data => {
        console.log('s', data);
        this.bluetoothSerial.subscribeRawData().subscribe((data) => {
          this.bluetoothSerial.read().then((data) => {
            console.log("pure data : ", data)
            console.log("get invertory data : " + JSON.stringify(data))
          });
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
          this.bluetoothSerial.read().then((data) => {
            console.log("data avaiable data : " + JSON.stringify(data))
          });
        });
      },
      err => {
        console.log('err', err);
      }
    )
  }



}

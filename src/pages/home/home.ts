import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';
import { PatrimonyProvider } from '../../providers/patrimony/patrimony';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [BluetoothSerial]
})
export class HomePage {

  public devices: Array<any> = [];
  public tags: Array<any> = [];
  public status: string = "";
  public connectionOn: boolean = false;

  constructor(
    public navCtrl: NavController,
    private bluetoothSerial: BluetoothSerial,
    private patrimonyProvider: PatrimonyProvider) {
  }

  public setStatus(status) {
    this.status = status;
  }

  public scan() {
    this.setStatus("scanning");
    this.bluetoothSerial.list().then(
      data => {
        this.setStatus("");
        this.devices = data;
      },
      err => {
        this.setStatus("Error on scan, retry!!");
        console.log(err);
      }
    )
  }

  public handleConnection(item) {
    if (!item) {
      return;
    }
    this.setStatus("connecting");
    this.connect(item, (statusConnection) => {
      if (statusConnection == 'OK') {
        this.openInterface('from handleConnection', (statusOpenInterface) => {
          if (statusOpenInterface == 'OK') {
            this.connectionOn = true;
            this.setStatus("");
          }
        })
      }
    })
  }

  public connect(item, cb = null) {
    if (!item) {
      return;
    }
    this.bluetoothSerial.connect(item.address).subscribe(
      status => {
        if (cb) {
          cb(status);
        }
        this.bluetoothSerial.subscribeRawData().subscribe((data) => {
          this.bluetoothSerial.read().then((data) => {
            this.parseTags(data);
            console.log("read data : " + JSON.stringify(data));
          });
        });
      },
      err => {
        console.log("error on connect: ", err);
      }
    )
  }

  public openInterface(log: string = '', cb) {
    this.setStatus("opening interface");
    console.log(log);
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
      status => {
        this.setStatus("interface oppended");
        cb(status)
      },
      err => {
        this.setStatus("Error on open interface");
        console.log('err', err);
      }
    )
  }

  public async getBatteryLevel() {
    try {
      let bateryLevel = await this.bluetoothSerial.write("Br.batt");
      this.openInterface('Br.batt', () => console.log('Br.batt sucssess'));
    } catch (err) {
      console.log(`There was an error: ${err}`);
    }
  }

  public disableBeep(param) {
    this.bluetoothSerial.write(`Br.beep,${param ? 1 : 0}`).then(
      data => {
        console.log(`beep: ${param ? 'on' : 'off'}`);
        this.openInterface('Br.beep', () => console.log('Br.beep sucssess'));
      },
      err => {
        console.log('err ' + err);
      }
    )
  }

  public getVersion() {
    this.bluetoothSerial.write('ver').then(
      status => {
        console.log(`ver: ${status}`);
        this.openInterface('ver', () => { });
      },
      err => {
        console.log('err', err);
      }
    )
  }

  public getInventory() {
    this.bluetoothSerial.write('I').then(
      data => {
        this.openInterface('getInventory', () => { });
      },
      err => {
        console.log('err', err);
      }
    )
  }

  public parseTags(tags) {
    let tagsSplited = tags.split('\r');

    let filteredTags = tagsSplited.filter((tag) => {
      let stringTag = new String(tag);
      return stringTag.startsWith("3") && stringTag.length == 32
    });

    // let checked = filteredTags.filter(element => {
    //   this.isIncluded(element.slice(22, 28), status => {
    //     if (!status) {
    //       return element;
    //     }
    //   })
    // });

    filteredTags.forEach(element => {
      this.isIncluded(element.slice(22, 28), status => {
        if (!status) {
          this.getPatrimonyByTag(element.slice(22, 28), (data,err) =>{
            let tagObj = {
              patrimony:{},
              tag:""
            };
            if(err){
              console.log('err',data)
            }
            if(data){
              tagObj.patrimony = data;
              tagObj.tag = element.slice(22, 28);
            }
            console.log('taaab=> ', tagObj);
            this.tags.push(tagObj);
          })
        }
      })
    });

    // checked.forEach(element => {
    //   this.tags.push(element.slice(22, 28))
    // });
  }

  getPatrimonyByTag(tag:String,cb){
    this.patrimonyProvider.getByTag(tag).subscribe(
      data=>{
        console.log(data);
        cb(data,null);
      },
      err=>{
        console.log('error: ', err);
        cb(null,err);
      }
    )
  }

  public isIncluded(element, cb) {
    let included = false;
    for (var i = 0; i < this.tags.length; i++) {
      if (this.tags[i].tag === element) {
        included = true;
        break;
      }
    }
    cb(included);
  }

  public clear() {
    this.tags = [];
  }

  public stop() {
    this.bluetoothSerial.write('s').then(
      data => {
        console.log('stop', data);
        this.openInterface('stop', () => { });
      },
      err => {
        console.log('err', err);
      }
    )
  }

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

  // public dataAvaiable() {
  //   this.bluetoothSerial.available().then(
  //     data => {
  //       console.log('dataAvaiable', data);
  //       this.bluetoothSerial.subscribeRawData().subscribe((data) => {
  //         console.log("iter : " + JSON.stringify(data));
  //         this.bluetoothSerial.read().then((data) => {
  //           console.log("data avaiable data : " + JSON.stringify(data))
  //         });
  //       });
  //     },
  //     err => {
  //       console.log('err', err);
  //     }
  //   )
  // }



}

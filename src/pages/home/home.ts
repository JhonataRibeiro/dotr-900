import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';
import { PatrimonyProvider } from '../../providers/patrimony/patrimony';
import { Loader } from '../../utils/loader/loader';
import { Message } from '../../utils/message/message';
import { R900Protocol } from '../../utils/protocol/r900Protocol'

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [BluetoothSerial, Loader, Message]
})
export class HomePage {

  public devices: Array<any> = [];
  public tags: Array<any> = [];
  public status: string = "";
  public showBeep: boolean = false;
  public connected: boolean = false;
  public batteryLevel: String = "";
  public inventoring: boolean = false;
  public requester: String = "";

  constructor(
    private navCtrl: NavController,
    private bluetoothSerial: BluetoothSerial,
    private patrimonyProvider: PatrimonyProvider,
    private zone: NgZone,
    private loader: Loader,
    private message: Message) {
    this.registerSubscribeData();
  }

  public registerSubscribeData() {
    this.bluetoothSerial.subscribeRawData().subscribe((data) => {
      this.bluetoothSerial.read().then((data) => {
        console.log(data);
        if ((data.indexOf("online=0")) >= 0) {
          this.setConnection(false);
        }

        if ((data.indexOf("CONNECT F0D7AA6993CE")) >= 0) {
          this.setConnection(false);
          this.message.notify('Erro ao conectar, reinicie o device(DOTR-900) e tente novamente!');
        }

        this.parseTags(data);
        if (this.requester == 'battery') {
          this.zone.run(() => {
            this.batteryLevel = data.slice(6, 8);
            this.clearRequester();
          });
        }
      });
    });
  }

  public setStatus(status) {
    this.status = status;
  }

  public setRequester(param) {
    this.requester = param;
  }

  public clearRequester() {
    this.requester = '';
  }

  public clearDevices() {
    this.devices = [];
  }

  public async scan() {
    try {
      this.checkBluetothIsEnabled();
      let devicesFound = await this.bluetoothSerial.list();
      this.devices = devicesFound;
    } catch (error) {
      console.log('error: ', error);

    }
  }

  public async checkBluetothIsEnabled() {
    try {
      let bluethothStatus = await this.bluetoothSerial.isEnabled();
      console.log('bluethothStatus =>', bluethothStatus);
    } catch (error) {
      console.log('error: ', error);
    }
  }

  public handleConnection(item) {
    if (!item) {
      return;
    }
    this.connect(item, (statusConnection) => {
      if (statusConnection == 'OK') {
        this.openInterface('from handleConnection', (statusOpenInterface) => {
          if (statusOpenInterface == 'OK') {
            this.getBatteryLevel();
            this.zone.run(() => {
              this.connected = true;
              this.clearDevices();
            });
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
      },
      err => {
        if (err == 'error on connect:  Device connection was lost') this.setConnection(false);
      }
    )
  }

  public async sendDislink() {
    try {
      let bluetoothDislink = this.bluetoothSerial.write(R900Protocol.CMD_DISLINK);
      this.openInterface('Br.off', () => console.log('Br.off sucssess'));
      this.clearDevices();
      console.log('bluetoothDislink: ', bluetoothDislink);
    } catch (error) {
      console.log('error: ', error);
    }
  }

  public async turnOff() {
    try {
      let bateryLevel = await this.bluetoothSerial.write("Br.off");
      this.openInterface('Br.off', () => console.log('Br.off sucssess'));
      this.clearDevices();
    } catch (err) {
      console.log(`There was an error: ${err}`);
    }
  }

  public isConnected() {
    try {
      let isConnected = this.bluetoothSerial.isConnected();
      console.log('isConnected=> ', isConnected);
    } catch (error) {
      console.log('error on connect: ', error);
    }
  }

  public setConnection(status) {
    this.zone.run(() => {
      this.connected = false;
    });
  }

  public openInterface(log: String = '', cb) {
    let data = new Uint8Array(8);
    data[0] = 0x0d;
    data[1] = 0x0d;
    data[2] = 0x0d;
    data[3] = 0x0d;
    data[4] = 0x0d;
    data[5] = 0x0d;
    data[6] = 0x0d;
    data[7] = 0x0d;

    try {
      let response = this.bluetoothSerial.write(data);
      cb(response);
    } catch (error) {
      console.log('error', error);
    }
  }

  public async getBatteryLevel() {
    try {
      let bateryLevel = await this.bluetoothSerial.write("Br.batt");
      this.openInterface('Br.batt', () => console.log('Br.batt sucssess'));
      this.setRequester('battery');
    } catch (err) {
      console.log(`There was an error: ${err}`);
    }
  }

  public toogleBeep(param) {
    this.bluetoothSerial.write(`Br.beep,${param ? 1 : 0}`).then(
      data => {
        console.log(`beep: ${param ? 'on' : 'off'}`);
        this.openInterface('Br.beep', () => {
          console.log('Br.beep sucssess')
          this.showBeep = param;
        });
      },
      err => {
        console.log('err ' + err);
      }
    )
  }

  public getVersion() {
    try {
      let deviceVersion = this.bluetoothSerial.write(R900Protocol.CMD_GET_VERSION);
      console.log(`ver: ${deviceVersion}`);
      this.setRequester('versão');
      this.openInterface(R900Protocol.CMD_GET_VERSION, () => { });
    } catch (error) {
      console.log('error', error);
    }
  }

  public getInventory() {
    this.bluetoothSerial.write(R900Protocol.CMD_INVENT).then(
      data => {
        this.inventoring = true;
        this.setRequester('inventário');
        this.openInterface('stop', () => { });
      },
      err => {
        console.log('err', err);
      }
    )
  }

  public stop() {
    this.bluetoothSerial.write(R900Protocol.CMD_STOP).then(
      data => {
        console.log('stop', data);
        this.inventoring = false;
        this.openInterface('stop', () => { });
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

    filteredTags.forEach(element => {
      this.isIncluded(element.slice(22, 28), status => {
        console.log('isIncluded=> ' + element.slice(22, 28) + ' status=> ', status);

        if (!status) {
          this.getPatrimonyByTag(element.slice(22, 28), (data, err) => {
            if (err) {
              console.log('err', data)
            }
            if (data != null) {
              let tagObj = {
                patrimony: data,
                tag: element.slice(22, 28)
              };
              console.log('taaab=> ', tagObj);
              this.zone.run(() => {
                console.log('oook');
                this.tags.push(tagObj);
              });
            }
          })
        }
      })
    });
  }

  getPatrimonyByTag(tag: String, cb) {
    this.patrimonyProvider.getByTag(tag).subscribe(
      data => {
        console.log(data);
        cb(data, null);
      },
      err => {
        console.log('error: ', err);
        cb(null, err);
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

  public writeTag() {
    this.bluetoothSerial.write("w,16,2,5,mesa").then(
      data => {
        console.log('s', data);
        this.bluetoothSerial.subscribeRawData().subscribe((data) => {
          this.bluetoothSerial.read().then((data) => {
            console.log("pure data : ", data.slice(3, 5));
            this.batteryLevel = data.slice(3, 5);
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
}

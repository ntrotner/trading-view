import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HTTP } from '@ionic-native/http/ngx';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class RequestsService {

  constructor(private angularHttp:HttpClient, private nativeHttp: HTTP, private platform: Platform) { }



  universalRequest(url:string):Promise<Object>{
    //check for platform
    let platforms = this._determinePlatforms()
    if(platforms.includes('cordova')){//this can only trigger on an actual android device, 'android' can still trigger in browser
      return this._getRequestNative(url)
    }else{//triggers in browser
      return this._getRequestAngular(url)
    }
  }


  /**
   * Sends HTTP GET requests using the angular client. For testing purposes within the browser one needs to disable CORS with a plugin for example.
   * @param url 
   */
  _getRequestAngular(url:string):Promise<Object>{
    return this.angularHttp.get(url).toPromise().then(
        resp => Promise.resolve(resp) //if succesful resolve object
      ).catch(
        err => Promise.resolve(err) //if unsuccessful resolve object as well for error handling
      )
  }


  /**
   * Sends HTTP GET requests using the native ionic client. This works on an Android phone or within a Cordova application.
   * It bypasses CORS policy so nothing has to be modified additionally.
   * @param url 
   */
  _getRequestNative(url:string):Promise<object>{
    return this.nativeHttp.get(url,{},{}).then(
      resp => {
        let data = JSON.parse(resp['data'])
        Promise.resolve(data)
      }   //if succesful resolve object
    ).catch(
      err => Promise.resolve(err) //if unsuccessful resolve object as well for error handling
    )
  }


  /**
   * Detected platforms of device.
   */
  _determinePlatforms():Array<string>{
    return this.platform.platforms()
  }


} 


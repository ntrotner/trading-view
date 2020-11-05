import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HTTP } from '@ionic-native/http/ngx';

@Injectable({
  providedIn: 'root'
})
export class RequestsService {

  constructor(private angularHttp:HttpClient, private nativeHttp: HTTP) { }


  /**
   * Sends HTTP GET requests using the angular client. For testing purposes within the browser one needs to disable CORS with a plugin for example.
   * @param url 
   */
  getRequestAngular(url:string):Promise<Object>{
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
  getRequestNative(url:string):Promise<object>{
    return this.nativeHttp.get(url,{},{}).then(
      resp => Promise.resolve(resp) //if succesful resolve object
    ).catch(
      err => Promise.resolve(err) //if unsuccessful resolve object as well for error handling
    )
  }


} 


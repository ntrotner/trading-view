import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RequestsService {

  constructor(private http:HttpClient) { }


  /**
   * Sends HTTP GET requests using the angular client. For testing purposes within the browser one needs to disable CORS.
   * For Chrome this can be done using the following plugin https://chrome.google.com/webstore/detail/cross-domain-cors/mjhpgnbimicffchbodmgfnemoghjakai/related
   * Native HTTP client will be added
   * @param url 
   */
  getRequestAngular(url:string, headers):Promise<Object>{
    console.log('exectute requests method')
    return this.http.get(url,headers).toPromise().then(
        resp => Promise.resolve(resp)
      ).catch(
        err => Promise.resolve(err)
      )
  }
} 

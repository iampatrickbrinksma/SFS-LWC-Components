import { LightningElement, api } from 'lwc';
import isOnlineOrOffline from '@salesforce/apex/lwcUtil.checkIfOnline';

export default class IsOnlineOrOffline extends LightningElement {

    @api isVisible = false;
    @api lblOffline = '🔴';
    @api lblOnline = '🟢';
    onlineTxt = '';
    onlineState = 'offline';
    onlineTxtCls = '';

    connectedCallback(){
        this.checkOnline();
    }

    @api
    checkOnline() {
        isOnlineOrOffline({})
        .then(result => {
            if (result === 'Online') {
                this.setState('online');
            } else {
                this.setState('offline');
            }
        })
        .catch(error => {
            console.log(JSON.stringify(error));
            this.setState('offline');
        })
    }    

    setState(state) {
        this.onlineState = state;
        if (state === 'offline') {
            this.onlineTxt = this.lblOffline;
            this.onlineTxtCls = 'slds-text-color_error';
        } else if (state === 'online') {
            this.onlineTxt = this.lblOnline;
            this.onlineTxtCls = 'slds-text-color_success';
        }
        this.dispatchOnlineState();
    }

    dispatchOnlineState(){
        const onlineStateEvent = new CustomEvent("stateonline", {
            detail: this.onlineState,
            composed: true,
            bubbles: true
          });
          this.dispatchEvent(onlineStateEvent);        
    }

}
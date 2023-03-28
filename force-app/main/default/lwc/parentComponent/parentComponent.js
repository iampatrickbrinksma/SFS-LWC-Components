import { LightningElement, api } from 'lwc';

export default class ParentComponent extends LightningElement {

    onlineState = '';

    handleOnlineState(event){
        this.onlineState = event.detail;
        console.log('Online state: ' + this.onlineState);
    }

    handleCheckOnline(event){
        const objChild = this.template.querySelector('c-is-online-or-offline');
        objChild.checkOnline();        
    }

}
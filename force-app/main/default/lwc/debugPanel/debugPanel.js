import { LightningElement, api } from 'lwc';

export default class DebugPanel extends LightningElement {

    @api
    writeToConsole;

    output;

    @api
    log( msg ) {
        this.addToOutput( msg );
        if ( this.writeToConsole ) {
            console.log( msg );
        }        
    }

    addToOutput( msg ) {
        this.output = this.timeStamp() + ' :: ' + msg + '\n' + this.output;
    }    

    timeStamp() {
        // Create timestamp
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60 * 1000;
        const dateLocal = new Date(now.getTime() - offsetMs);
        return dateLocal.toISOString().replace(/-/g, "/").replace("T", " ");  
    }

    // Copy content
    copyOutput() {
        if ( navigator.clipboard && window.isSecureContext ) {
            navigator.clipboard.writeText( this.output );
        }
    }

    // Clear debug output
    clearOutput() {
        this.output = '';
    }    

}
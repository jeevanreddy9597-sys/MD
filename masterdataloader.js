class MasterDataLoader extends HTMLElement {
 constructor(){super();this.attachShadow({mode:"open"});}
 connectedCallback(){this.shadowRoot.innerHTML=`<div style="padding:10px;font-family:Arial"><h3>Master Data Loader</h3><input type="file"/></div>`;}
}
customElements.define("com-company-masterdataloader", MasterDataLoader);
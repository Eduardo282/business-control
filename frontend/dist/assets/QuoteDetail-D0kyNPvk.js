const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/jspdf.es.min-DJiUYuwi.js","assets/index-BH9wGhQj.js","assets/index-_5pD7uUK.css"])))=>i.map(i=>d[i]);
import{e as bt,r as c,j as e,d as ht,L as ut,_ as O,S as ft}from"./index-BH9wGhQj.js";import{B as y}from"./Button-9baBbbFl.js";import{C as Me}from"./Card-DGWfnA_G.js";import{I as vt}from"./Input-zp2PO_74.js";import{g as jt,s as V,t as wt}from"./quotes.api-qnPW3jgy.js";import{M as Le,R as yt,X as Nt,b as kt,W as St}from"./FlatIcons-D4Qf3ZyF.js";function W(l){return(l!=null&&l.folio?String(l.folio).trim():"")||`#${(l==null?void 0:l.id)??""}`}function Te(l){return(l!=null&&l.folio?String(l.folio).trim():String((l==null?void 0:l.id)??"quote")).replace(/[^a-zA-Z0-9-_]+/g,"_")||"quote"}let F=null;async function Ct(){return F||(F=(async()=>{try{const l=await O(()=>import("./html2canvas.esm-CBrSDip1.js"),[]);return l.default||l}catch{const l=await O(()=>import("./html2canvas.esm-CBrSDip1.js"),[]);return l.default||l}})().catch(l=>{throw F=null,l})),F}function _t(){return new Promise(l=>{requestAnimationFrame(()=>{requestAnimationFrame(l)})})}function Ft(){var me,ge,be,he,ue,fe,ve,je,we,ye,Ne;const{id:l}=bt(),[a,B]=c.useState(null),[Ie,H]=c.useState(!0),[G,qe]=c.useState(""),[Re,Z]=c.useState(!1),[_,J]=c.useState(""),[Y,Ue]=c.useState(""),[M,K]=c.useState(!1),[Q,L]=c.useState(""),[ee,te]=c.useState(""),[N,ae]=c.useState(!1),[se,ie]=c.useState(!1),[T,E]=c.useState(null),[Xe,z]=c.useState(!1),[k,Ve]=c.useState(""),[re,I]=c.useState(""),oe=c.useRef(null),j=(t,i)=>{ft.fire({toast:!0,position:"top-end",icon:t,title:i,showConfirmButton:!1,timer:2300,timerProgressBar:!0,width:360,padding:"0.75rem 1rem"})};c.useEffect(()=>{We()},[l]);const We=async()=>{var t,i,o,r;H(!0);try{const d=await jt(l);B(d)}catch(d){console.error(d);const p=((r=(o=(i=(t=d.response)==null?void 0:t.data)==null?void 0:i.errors)==null?void 0:o[0])==null?void 0:r.message)||d.message||"Error al cargar cotización";qe(p)}finally{H(!1)}},Oe=async()=>{const t=oe.current;if(!t)throw new Error("No se pudo obtener la vista de la cotización.");return await _t(),(await Ct())(t,{scale:2,useCORS:!0,backgroundColor:"#ffffff",logging:!1,windowWidth:t.scrollWidth,windowHeight:t.scrollHeight,scrollX:0,scrollY:-window.scrollY,onclone:o=>{const r=o.querySelector('[data-export-preview="quote"]');r&&(r.style.opacity="1",r.style.filter="none",r.style.transform="none",r.style.animation="none"),o.querySelectorAll(".animate-fade-in, .animate-slide-up, .animate-scale-in").forEach(p=>{p.style.opacity="1",p.style.filter="none",p.style.transform="none",p.style.animation="none",p.style.transition="none"})}})},P=async()=>{const t=await Oe(),i=await O(()=>import("./jspdf.es.min-DJiUYuwi.js").then(w=>w.j),__vite__mapDeps([0,1,2])),o=i.jsPDF||i.default,r=new o({unit:"pt",format:"a4"}),d=r.internal.pageSize.getWidth(),p=r.internal.pageSize.getHeight(),x=16,g=d-x*2,b=p-x*2,h=t.height*g/t.width,u=t.toDataURL("image/png",1);let s=h,m=0;for(r.addImage(u,"PNG",x,x,g,h,void 0,"FAST"),s-=b;s>0;)r.addPage(),m+=b,r.addImage(u,"PNG",x,x-m,g,h,void 0,"FAST"),s-=b;const v=r.output("datauristring").split(",")[1]||"";return{doc:r,pdfBase64:v}},He=async()=>{const t=Te(a);try{const{doc:i}=await P(),o=i.output("blob"),r=URL.createObjectURL(o);window.open(r,"_blank","noopener")||i.save(`Cotizacion_${t}.pdf`),setTimeout(()=>URL.revokeObjectURL(r),6e4),j("success","PDF exportado con la vista actual.")}catch(i){j("error",(i==null?void 0:i.message)||"No se pudo exportar el PDF.")}},Ge=async()=>{var i;if(!k)return I("Debes seleccionar un contacto.");const t=(((i=a.client)==null?void 0:i.contacts)||[]).find(o=>String(o.id)===String(k));if(!(t!=null&&t.has_portal_access))return I("El contacto seleccionado no tiene portal habilitado.");if(await Ze(!0,k),t.email)try{const o=(Number(a.total)||0)*1.16,{pdfBase64:r}=await P();await V({quote_id:a.id,contact_email:t.email,message:le(t.full_name,o),pdf_base64:r}),j("success",`Portal habilitado y cotización enviada a ${t.email}`)}catch(o){E({type:"error",message:o.message||"Portal habilitado, pero no se pudo enviar el PDF al contacto."})}z(!1)},Ze=async(t,i)=>{ae(!0);try{await wt(a.id,t,i),B({...a,is_sent_to_client_portal:t})}catch(o){alert("Error actualizando portal: "+o.message)}finally{ae(!1)}},Je=async()=>{if(!_)return L("Debes ingresar o seleccionar un correo");K(!0),L(""),te("");try{const{pdfBase64:t}=await P();await V({quote_id:a.id,contact_email:_,message:Y,pdf_base64:t}),te("Correo enviado correctamente."),setTimeout(()=>Z(!1),2e3)}catch(t){L(t.message||"Error al enviar correo")}finally{K(!1)}},le=(t,i)=>{var r;const o=W(a);return`Estimado ${t||"cliente"},

Adjunto encontrará la cotización ${o} por un total de $${Number(i||0).toLocaleString("es-MX",{minimumFractionDigits:2})}.

Quedo a la espera de sus comentarios.

Saludos,
${((r=a.user)==null?void 0:r.full_name)||"Equipo de Ventas"}`},Ye=async()=>{var i,o;const t=(i=a.contact)!=null&&i.email?a.contact:(((o=a.client)==null?void 0:o.contacts)||[]).find(r=>r.email);if(!(t!=null&&t.email)){E({type:"error",message:"Esta cotización no tiene un correo de contacto para envío."});return}ie(!0),E(null);try{const r=(Number(a.total)||0)*1.16,{pdfBase64:d}=await P();await V({quote_id:a.id,contact_email:t.email,message:le(t.full_name,r),pdf_base64:d}),j("success",`Cotización enviada a ${t.email}`)}catch(r){E({type:"error",message:r.message||"No se pudo enviar el correo al contacto."})}finally{ie(!1)}},Ke=async()=>{var i,o,r,d,p,x,g,b,h,u;const t=Te(a);try{const s=n=>String(n??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;"),m=n=>`$${Number(n||0).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2})}`,ke=n=>`${Number(n||0).toLocaleString("es-MX",{maximumFractionDigits:2})}%`,v=n=>Math.round((Number(n)||0)*100)/100,w=Array.isArray(a==null?void 0:a.items)?a.items:[],Se=v(w.reduce((n,f)=>{const D=Number(f.quantity)||0,X=Number(f.base_unit_price||f.unit_price||f.price)||0;return n+X*D},0)),A=v(Number(a==null?void 0:a.total)||w.reduce((n,f)=>n+(Number(f.total)||0),0)),it=v(Math.max(0,Se-A)),Ce=v(A*.16),rt=v(A+Ce),ot=W(a),lt=a!=null&&a.created_at?new Date(a.created_at).toLocaleDateString("es-MX"):"",_e="15 dias naturales",nt=w.length>0?w.map((n,f)=>{var Ae,De,Fe,Be;const D=Number(n.quantity)||0,X=Number(n.base_unit_price||n.unit_price||n.price)||0,ze=Math.min(100,Math.max(0,Number(n.discount||0))),Pe=Number(n.unit_price||n.price)||0,xt=Number(n.total)||Pe*D,mt=f%2===0?"#ffffff":"#f8fafc",$e=Number((Ae=n.product)==null?void 0:Ae.users_count)||0,gt=[((De=n.product)==null?void 0:De.description)||((Fe=n.product)==null?void 0:Fe.category)||"",$e>0?`${$e} Usuario(s)`:""].filter(Boolean).join(" | ");return`
                <tr style="background:${mt};">
                  <td style="padding:12px 12px; border-bottom:1px solid #e2e8f0; vertical-align:top;">
                    <div style="font-weight:700; color:#1e293b; font-size:14px;">${s(((Be=n.product)==null?void 0:Be.name)||"Producto eliminado")}</div>
                    <div style="margin-top:4px; color:#64748b; font-size:11px; line-height:1.4;">${s(gt)}</div>
                  </td>
                  <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:center; vertical-align:top; color:#475569;">${s(String(D))}</td>
                  <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:right; vertical-align:top; color:#475569;">${s(m(X))}</td>
                  <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:right; vertical-align:top; color:${ze>0?"#be123c":"#475569"};">${s(ke(ze))}</td>
                  <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:right; vertical-align:top; color:#475569;">${s(m(Pe))}</td>
                  <td style="padding:12px 12px; border-bottom:1px solid #e2e8f0; text-align:right; vertical-align:top; color:#0f172a; font-weight:700;">${s(m(xt))}</td>
                </tr>
              `}).join(""):'<tr><td colspan="6" style="padding:14px; text-align:center; color:#64748b; border-bottom:1px solid #e2e8f0;">Sin partidas en la cotizacion</td></tr>',dt=a!=null&&a.notes?`<div class="notes-wrap">
             <div class="section-title">Notas Adicionales</div>
             <div class="notes-card">${s(a.notes).replace(/\n/g,"<br />")}</div>
           </div>`:"",ct=`
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="UTF-8" />
            <meta name="ProgId" content="Word.Document" />
            <meta name="Generator" content="Microsoft Word 15" />
            <meta name="Originator" content="Microsoft Word 15" />
            <!--[if gte mso 9]>
            <xml>
              <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>100</w:Zoom>
                <w:DoNotOptimizeForBrowser/>
              </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
              @page {
                size: A4;
                margin: 1.2cm;
              }
              body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #0f172a;
              }
              .page {
                width: 100%;
                max-width: 980px;
                margin: 0 auto;
                border: 1px solid #e2e8f0;
              }
              .top-strip {
                background: #1d4f88;
                color: #ffffff;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 9px 22px;
              }
              .top-strip table {
                width: 100%;
                border-collapse: collapse;
              }
              .top-strip td:last-child {
                text-align: right;
              }
              .main-block {
                padding: 28px 26px;
                border-bottom: 1px solid #e2e8f0;
              }
              .main-grid {
                width: 100%;
                border-collapse: collapse;
              }
              .main-grid td {
                vertical-align: top;
              }
              .title {
                font-size: 54px;
                line-height: 1;
                font-weight: 800;
                margin: 0;
                color: #0f172a;
                letter-spacing: -0.8px;
              }
              .subtitle {
                margin-top: 8px;
                color: #64748b;
                font-size: 20px;
                line-height: 1.35;
              }
              .brand {
                text-align: right;
              }
              .brand-name {
                font-size: 32px;
                font-weight: 800;
                color: #0f172a;
                margin: 0;
                line-height: 1.15;
              }
              .brand-meta {
                margin-top: 8px;
                color: #64748b;
                font-size: 13px;
                line-height: 1.5;
              }
              .metric-table {
                margin-top: 18px;
                width: 100%;
                border-collapse: separate;
                border-spacing: 8px 0;
                margin-left: -8px;
                margin-right: -8px;
              }
              .metric-card {
                border: 1px solid #e2e8f0;
                background: #f8fafc;
                border-radius: 12px;
                padding: 10px 14px;
              }
              .metric-label {
                margin: 0;
                font-size: 10px;
                color: #64748b;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.4px;
              }
              .metric-value {
                margin: 4px 0 0;
                font-size: 15px;
                color: #0f172a;
                font-weight: 700;
              }
              .info-wrap {
                padding: 20px 26px;
                border-bottom: 1px solid #e2e8f0;
                background: #f8fafc;
              }
              .info-grid {
                width: 100%;
                border-collapse: separate;
                border-spacing: 10px 0;
                margin-left: -10px;
                margin-right: -10px;
              }
              .card {
                border: 1px solid #e2e8f0;
                background: #ffffff;
                border-radius: 14px;
                padding: 15px;
              }
              .section-title {
                margin: 0 0 8px;
                font-size: 11px;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 700;
              }
              .client-name {
                margin: 0;
                font-size: 24px;
                font-weight: 800;
                color: #0f172a;
                line-height: 1.2;
              }
              .meta-text {
                margin-top: 5px;
                color: #475569;
                font-size: 12px;
                line-height: 1.45;
              }
              .small-muted {
                margin-top: 4px;
                color: #64748b;
                font-size: 11px;
              }
              .items-wrap {
                padding: 18px 26px;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
              }
              .items-table th {
                background: #0f172a;
                color: #ffffff;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.35px;
                font-weight: 700;
                padding: 10px;
                text-align: left;
              }
              .items-table th.center,
              .items-table td.center {
                text-align: center;
              }
              .items-table th.right,
              .items-table td.right {
                text-align: right;
              }
              .summary-wrap {
                padding: 4px 26px 18px;
              }
              .summary-grid {
                width: 100%;
                border-collapse: separate;
                border-spacing: 10px 0;
                margin-left: -10px;
                margin-right: -10px;
              }
              .conditions {
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                background: #f8fafc;
                padding: 14px;
              }
              .conditions ul {
                margin: 0;
                padding-left: 16px;
                color: #475569;
                font-size: 12px;
                line-height: 1.55;
              }
              .finance {
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                background: #ffffff;
                padding: 14px;
              }
              .totals-table {
                width: 100%;
                border-collapse: collapse;
              }
              .totals-table td {
                padding: 3px 0;
                font-size: 12px;
                color: #475569;
              }
              .totals-table td:last-child {
                text-align: right;
                color: #0f172a;
                font-weight: 600;
              }
              .totals-final td {
                border-top: 1px solid #0f172a;
                padding-top: 9px;
                font-size: 18px;
                font-weight: 800;
                color: #0f172a;
              }
              .notes-wrap {
                padding: 0 26px 18px;
              }
              .notes-card {
                border: 1px solid #e2e8f0;
                background: #f8fafc;
                border-radius: 12px;
                padding: 12px;
                color: #475569;
                font-size: 12px;
                line-height: 1.5;
              }
              .sign-wrap {
                padding: 0 26px 18px;
              }
              .sign-grid {
                width: 100%;
                border-collapse: separate;
                border-spacing: 10px 0;
                margin-left: -10px;
                margin-right: -10px;
              }
              .sign-card {
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                background: #ffffff;
                padding: 12px;
              }
              .line-space {
                margin-top: 28px;
                border-top: 1px solid #94a3b8;
                padding-top: 6px;
                font-size: 11px;
                color: #64748b;
              }
              .footer {
                background: #0f172a;
                color: #ffffff;
                padding: 20px 26px;
              }
              .footer-grid {
                width: 100%;
                border-collapse: collapse;
              }
              .footer-title {
                margin: 0 0 5px;
                font-size: 11px;
                text-transform: uppercase;
                color: #34d399;
                font-weight: 700;
              }
              .footer-copy {
                color: #94a3b8;
                font-size: 11px;
                line-height: 1.45;
              }
              .footer-note {
                text-align: right;
                color: #94a3b8;
                font-size: 11px;
                line-height: 1.45;
              }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="top-strip">
                <table>
                  <tr>
                    <td>Business Control | Documento Comercial</td>
                  </tr>
                </table>
              </div>

              <div class="main-block">
                <table class="main-grid">
                  <tr>
                    <td style="width:62%; padding-right:10px;">
                      <h1 class="title">COTIZACION</h1>
                      <div class="subtitle">Propuesta comercial formal para revision y aprobacion.</div>
                    </td>
                    <td style="width:38%;">
                      <div class="brand">
                        <h2 class="brand-name">Business Control</h2>
                        <div class="brand-meta">
                          Av. Vallarta #1234, Col. Americana<br />
                          Guadalajara, Jalisco, CP 44100<br />
                          ventas@businesscontrol.com
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>

                <table class="metric-table">
                  <tr>
                    <td style="width:33.33%;">
                      <div class="metric-card">
                        <p class="metric-label">Folio</p>
                        <p class="metric-value">${s(ot)}</p>
                      </div>
                    </td>
                    <td style="width:33.33%;">
                      <div class="metric-card">
                        <p class="metric-label">Fecha de Emision</p>
                        <p class="metric-value">${s(lt)}</p>
                      </div>
                    </td>
                    <td style="width:33.33%;">
                      <div class="metric-card">
                        <p class="metric-label">Vigencia</p>
                        <p class="metric-value">${s(_e)}</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <div class="info-wrap">
                <table class="info-grid">
                  <tr>
                    <td style="width:66.6%; vertical-align:top;">
                      <div class="card">
                        <p class="section-title">Cliente asignado</p>
                        <p class="client-name">${s(((i=a.client)==null?void 0:i.business_name)||"Cliente eliminado")}</p>
                        <div class="meta-text">${s(((o=a.client)==null?void 0:o.address)||"Domicilio no registrado")}</div>
                        <div class="small-muted">RFC: ${s(((r=a.client)==null?void 0:r.rfc)||"XAXX010101000")}</div>

                        <div style="margin-top:10px; padding-top:10px; border-top:1px solid #e2e8f0;">
                          <p class="section-title" style="margin-bottom:6px;">Contacto asignado</p>
                          <div class="meta-text" style="margin-top:0;">
                            <strong>${s(((d=a.contact)==null?void 0:d.full_name)||"Sin contacto asignado")}</strong><br />
                            ${s(((p=a.contact)==null?void 0:p.position_title)||"Sin puesto")}<br />
                            ${s(((x=a.contact)==null?void 0:x.email)||"Sin correo")}<br />
                            ${s(((g=a.contact)==null?void 0:g.phone)||"Sin telefono")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style="width:33.4%; vertical-align:top;">
                      <div class="card">
                        <p class="section-title">Ejecutivo de Ventas</p>
                        <div class="meta-text" style="margin-top:0;">
                          <strong>${s(((b=a.user)==null?void 0:b.full_name)||"Usuario eliminado")}</strong><br />
                          ${s(((h=a.user)==null?void 0:h.email)||"Sin correo")}
                        </div>
                        <div class="small-muted" style="margin-top:10px; padding-top:10px; border-top:1px solid #e2e8f0; line-height:1.45;">
                          Canal: Atencion comercial directa<br />
                          Moneda: MXN<br />
                          Impuesto aplicado: IVA 16%
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <div class="items-wrap">
                <table class="items-table">
                  <thead>
                    <tr>
                      <th style="width:40%;">Descripcion / Producto</th>
                      <th class="center" style="width:10%;">Cant</th>
                      <th class="right" style="width:13%;">Precio Lista</th>
                      <th class="right" style="width:10%;">Desc.</th>
                      <th class="right" style="width:13%;">Precio Unit.</th>
                      <th class="right" style="width:14%;">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${nt}
                  </tbody>
                </table>
              </div>

              <div class="summary-wrap">
                <table class="summary-grid">
                  <tr>
                    <td style="width:64%; vertical-align:top;">
                      <div class="conditions">
                        <p class="section-title">Condiciones Comerciales</p>
                        <ul>
                          <li>Esta propuesta tiene una vigencia de ${s(_e)}.</li>
                          <li>Los precios se expresan en MXN e incluyen descuentos aplicados por partida.</li>
                          <li>El tiempo de entrega queda sujeto a disponibilidad y confirmacion de inventario.</li>
                          <li>Cualquier ajuste posterior debera formalizarse mediante actualizacion de cotizacion.</li>
                        </ul>
                      </div>
                    </td>
                    <td style="width:36%; vertical-align:top;">
                      <div class="finance">
                        <p class="section-title">Resumen Financiero</p>
                        <table class="totals-table">
                          <tr><td>Subtotal bruto</td><td>${s(m(Se))}</td></tr>
                          <tr><td>Descuento</td><td>-${s(m(it))}</td></tr>
                          <tr><td>Subtotal neto</td><td>${s(m(A))}</td></tr>
                          <tr><td>IVA (16%)</td><td>${s(m(Ce))}</td></tr>
                          <tr class="totals-final"><td>Total Neto</td><td>${s(m(rt))}</td></tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              ${dt}

              <div class="sign-wrap">
                <table class="sign-grid">
                  <tr>
                    <td style="width:50%; vertical-align:top;">
                      <div class="sign-card">
                        <p class="section-title">Aceptacion del Cliente</p>
                        <div class="line-space">Nombre y firma</div>
                      </div>
                    </td>
                    <td style="width:50%; vertical-align:top;">
                      <div class="sign-card">
                        <p class="section-title">Ejecutivo Responsable</p>
                        <div class="line-space">${s(((u=a.user)==null?void 0:u.full_name)||"Sin asignar")}</div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <div class="footer">
                <table class="footer-grid">
                  <tr>
                    <td style="width:60%; vertical-align:top; padding-right:10px;">
                      <p class="footer-title">Informacion de Pago</p>
                      <div class="footer-copy">
                        Banco: BBVA Bancomer<br />
                        Cuenta: 0123456789<br />
                        CLABE: 012000001234567890<br />
                        Beneficiario: Business Control S.A. de C.V.
                      </div>
                    </td>
                    <td style="width:40%; vertical-align:top;">
                      <div class="footer-note">
                        * Precios sujetos a cambio sin previo aviso.<br />
                        * Tiempo de entrega sujeto a disponibilidad.
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </body>
        </html>
      `,pt=new Blob(["\uFEFF",ct],{type:"application/msword;charset=utf-8"}),Ee=URL.createObjectURL(pt),C=document.createElement("a");C.href=Ee,C.download=`Cotizacion_${t}.doc`,document.body.appendChild(C),C.click(),document.body.removeChild(C),URL.revokeObjectURL(Ee),j("success","Word exportado correctamente.")}catch(s){j("error",(s==null?void 0:s.message)||"No se pudo exportar Word.")}};if(Ie)return e.jsx("div",{className:"flex h-screen items-center justify-center text-light-text-secondary dark:text-slate-400",children:"Cargando cotización..."});if(G)return e.jsx("div",{className:"p-8 text-center text-light-text-secondary dark:text-red-400 bg-light-error/10 dark:bg-red-500/10 rounded-xl m-4",children:G});if(!a)return e.jsx("div",{className:"p-8 text-center text-light-text-secondary dark:text-slate-400",children:"Cotización no encontrada"});const S=t=>Math.round((Number(t)||0)*100)/100,q=Array.isArray(a.items)?a.items:[],ne=S(q.reduce((t,i)=>{const o=Number(i.quantity)||0,r=Number(i.base_unit_price||i.unit_price||i.price)||0;return t+r*o},0)),$=S(Number(a.total)||q.reduce((t,i)=>t+(Number(i.total)||0),0)),Qe=S(Math.max(0,ne-$)),de=S($*.16),et=S($+de),ce=W(a),tt=new Date(a.created_at).toLocaleDateString("es-MX"),pe="15 días naturales",R=(me=a.contact)!=null&&me.email?a.contact:(((ge=a.client)==null?void 0:ge.contacts)||[]).find(t=>t.email),at=(R==null?void 0:R.email)||"",xe=((be=a.client)==null?void 0:be.contacts)||[],U=xe.find(t=>String(t.id)===String(k)),st=!!(U!=null&&U.has_portal_access);return e.jsxs("div",{className:"space-y-6 animate-fade-in pb-20 print:p-0 print:space-y-0 relative",children:[e.jsx("div",{className:"absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary-900/20 to-transparent -z-10 blur-3xl rounded-full opacity-50 print:hidden"}),Re&&e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in",children:e.jsxs(Me,{className:"w-full max-w-lg shadow-2xl shadow-primary-500/10 border-light-border dark:border-white/10 !bg-light-card dark:!bg-slate-900/95",children:[e.jsxs("h3",{className:"text-xl font-bold text-light-text-primary dark:text-white mb-4 flex items-center gap-2",children:[e.jsx("span",{className:"text-primary-600 dark:text-primary-400",children:e.jsx(Le,{size:24})})," ","Enviar por Correo"]}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-light-text-secondary dark:text-slate-400 mb-1",children:"Seleccionar contacto"}),e.jsxs("select",{className:"w-full rounded-xl border border-light-border dark:border-white/10 bg-light-bg dark:bg-black/30 p-2 text-light-text-primary dark:text-slate-200 outline-none focus:ring-1 focus:ring-primary-500 text-sm",onChange:t=>J(t.target.value),value:_,children:[e.jsx("option",{value:"",children:"-- Seleccionar o Escribir abajo --"}),(ue=(he=a.client)==null?void 0:he.contacts)==null?void 0:ue.map(t=>e.jsxs("option",{value:t.email||"",children:[t.full_name," (",t.email||"Sin correo",")"]},t.id))]})]}),e.jsx(vt,{label:"Correo destino",value:_,onChange:t=>J(t.target.value),placeholder:"ej: cliente@empresa.com",className:"bg-light-bg dark:bg-black/30 border-light-border dark:border-white/10 text-light-text-primary dark:text-slate-200"}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("label",{className:"block text-xs font-medium text-light-text-secondary dark:text-slate-400",children:"Mensaje"}),e.jsx("textarea",{className:"w-full rounded-xl border border-light-border dark:border-white/10 bg-light-bg dark:bg-black/30 p-3 text-sm text-light-text-primary dark:text-slate-200 h-32 focus:ring-1 focus:ring-primary-500 outline-none resize-none",value:Y,onChange:t=>Ue(t.target.value)})]}),Q&&e.jsx("div",{className:"p-3 rounded-xl bg-light-error/10 dark:bg-red-500/10 text-light-error dark:text-red-300 text-xs border border-light-error/20 dark:border-red-500/20",children:Q}),ee&&e.jsx("div",{className:"p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs border border-emerald-500/20",children:ee}),e.jsx("p",{className:"text-[10px] text-light-text-secondary dark:text-slate-500 text-center",children:"* Verificación activa con ZeroBounce antes de envío."}),e.jsxs("div",{className:"flex justify-end gap-2 pt-2",children:[e.jsx(y,{variant:"ghost",onClick:()=>Z(!1),disabled:M,children:"Cancelar"}),e.jsx(y,{onClick:Je,disabled:M,className:"shadow-lg shadow-primary-500/20 button-primary",children:M?"Enviando...":"Enviar Correo"})]})]})]})}),Xe&&ht.createPortal(e.jsxs("div",{className:"fixed inset-0 z-[120] flex items-center justify-center p-4 animate-fade-in",children:[e.jsx("button",{type:"button","aria-label":"Cerrar modal",onClick:()=>!N&&z(!1),className:"absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"}),e.jsxs(Me,{className:"relative w-full max-w-lg overflow-hidden !bg-white border border-slate-200 shadow-2xl shadow-slate-900/20",children:[e.jsxs("div",{className:"px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4",children:[e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-[#1B4733]/10 text-[#1B4733] inline-flex items-center justify-center shrink-0",children:e.jsx(yt,{size:20})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-2xl font-bold text-slate-900 leading-none",children:"Enviar a Portal"}),e.jsx("p",{className:"text-sm text-slate-600 mt-2 max-w-sm leading-relaxed",children:"Selecciona el contacto que recibira acceso a esta cotizacion en su portal."})]})]}),e.jsx("button",{type:"button",onClick:()=>z(!1),disabled:N,className:"w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center transition-colors",children:e.jsx(Nt,{size:16})})]}),e.jsxs("div",{className:"px-6 py-5 space-y-4 bg-white",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5",children:"Seleccionar contacto"}),e.jsxs("select",{className:"w-full rounded-xl border border-slate-300 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#1B4733]/20 focus:border-[#1B4733] transition-colors",onChange:t=>{Ve(t.target.value),I("")},value:k,children:[e.jsx("option",{value:"",children:"-- Seleccionar --"}),xe.map(t=>e.jsxs("option",{value:t.id,disabled:!t.has_portal_access,children:[t.full_name," (",t.email||"Sin correo",")",t.has_portal_access?"":" - portal no habilitado"]},t.id))]}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1.5",children:"Solo se puede enviar a contactos con portal habilitado."})]}),re&&e.jsx("div",{className:"px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200",children:re})]}),e.jsxs("div",{className:"px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-2",children:[e.jsx(y,{variant:"ghost",onClick:()=>z(!1),disabled:N,className:"!bg-white !border !border-slate-200 !text-slate-700 hover:!bg-slate-100 disabled:!opacity-50",children:"Cancelar"}),e.jsx("button",{onClick:Ge,disabled:N||!st,className:"!bg-[#2B7FBE] hover:!bg-[#236EA8] !text-white !rounded-2xl !px-6 !py-2.5 shadow-[0_7px_14px_rgba(43,127,190,0.32)] hover:shadow-[0_9px_18px_rgba(43,127,190,0.38)] !transition-all !duration-150 disabled:!opacity-50 disabled:!cursor-not-allowed",children:N?"Enviando...":"Confirmar y Enviar"})]})]})]}),document.body),e.jsxs("div",{className:"glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden sticky top-6 z-40 backdrop-blur-xl shadow-xl",children:[e.jsxs("div",{children:[e.jsxs(ut,{to:"/cotizaciones/historial",className:"text-xs font-medium text-light-text-secondary hover:text-light-text-primary flex items-center gap-1 transition-colors group",children:[e.jsx("span",{className:"group-hover:-translate-x-1 transition-transform",children:e.jsx(kt,{size:16})})," ","Volver al historial"]}),e.jsxs("div",{className:"flex items-center gap-3 mt-1",children:[e.jsxs("h2",{className:"text-xl font-bold text-light-text-primary",children:["Cotización ",ce]}),e.jsx("span",{className:`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${a.status==="PENDING"?"text-yellow-500":a.status==="ACCEPTED"?"text-emerald-400":"text-slate-500"}`,children:a.status})]})]}),e.jsxs("div",{className:"flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end",children:[e.jsxs(y,{variant:"ghost",onClick:Ye,disabled:se||!at,className:"flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !border !border-[#1B4733]/30 !text-light-text-secondary !transition-all !duration-150 disabled:!opacity-50 disabled:!cursor-not-allowed disabled:!bg-white disabled:!text-emerald-700 disabled:!border-emerald-200 !flex !items-center !gap-2 !justify-center hover:!bg-[#1B4733]/15",children:[e.jsx(Le,{size:16}),se?"Enviando...":"Enviar al contacto"]}),e.jsxs(y,{variant:"ghost",onClick:He,className:"flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !bg-white !border !border-red-200 !text-red-600 hover:!bg-red-50 !shadow-none !transition-colors !duration-150 !flex !items-center !gap-1.5 !justify-center",children:[e.jsx(St,{size:16})," Exportar a PDF"]}),e.jsx(y,{variant:"ghost",onClick:Ke,className:"flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !bg-white !border !border-[#315A9B]/35 !text-[#315A9B] hover:!bg-[#315A9B]/10 !shadow-none !transition-colors !duration-150 !flex !items-center !gap-1.5 !justify-center",children:"Exportar a Word"})]})]}),T&&e.jsx("div",{className:`print:hidden px-4 py-3 rounded-xl border text-sm ${T.type==="success"?"bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300":"bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-300"}`,children:T.message}),e.jsxs("div",{"data-export-preview":"quote",ref:oe,className:"mx-auto max-w-5xl bg-white text-slate-900 shadow-2xl print:shadow-none print:w-full print:m-0 animate-slide-up origin-top border border-slate-200 rounded-2xl overflow-hidden",children:[e.jsx("div",{className:"bg-gradient-to-r from-[#0f274d] via-[#154982] to-[#1d6fb3] text-white px-8 md:px-12 py-3 flex items-center justify-between text-xs tracking-wide uppercase font-semibold print:bg-white print:text-slate-900 print:border-b print:border-slate-200",children:e.jsx("span",{children:"Business Control | Documento Comercial"})}),e.jsxs("div",{className:"p-8 md:p-12 border-b border-slate-100",children:[e.jsxs("div",{className:"flex flex-col md:flex-row justify-between gap-8",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-4xl font-extrabold text-slate-900 tracking-tight",children:"COTIZACIÓN"}),e.jsx("p",{className:"mt-2 text-sm text-slate-500",children:"Propuesta comercial formal para revisión y aprobación."})]}),e.jsxs("div",{className:"text-left md:text-right",children:[e.jsx("div",{className:"text-3xl font-extrabold text-slate-900 tracking-tight",children:"Business Control"}),e.jsxs("div",{className:"text-sm text-slate-500 mt-2 leading-relaxed",children:["Av. Vallarta #1234, Col. Americana",e.jsx("br",{}),"Guadalajara, Jalisco, CP 44100",e.jsx("br",{}),"ventas@businesscontrol.com"]})]})]}),e.jsxs("div",{className:"mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",children:[e.jsxs("div",{className:"rounded-xl border border-slate-200 bg-slate-50 px-4 py-3",children:[e.jsx("p",{className:"text-[10px] uppercase tracking-wider text-slate-500 font-semibold",children:"Folio"}),e.jsx("p",{className:"text-sm font-mono font-bold text-slate-900 mt-1",children:ce})]}),e.jsxs("div",{className:"rounded-xl border border-slate-200 bg-slate-50 px-4 py-3",children:[e.jsx("p",{className:"text-[10px] uppercase tracking-wider text-slate-500 font-semibold",children:"Fecha de Emisión"}),e.jsx("p",{className:"text-sm font-semibold text-slate-900 mt-1",children:tt})]}),e.jsxs("div",{className:"rounded-xl border border-slate-200 bg-slate-50 px-4 py-3",children:[e.jsx("p",{className:"text-[10px] uppercase tracking-wider text-slate-500 font-semibold",children:"Vigencia"}),e.jsx("p",{className:"text-sm font-semibold text-slate-900 mt-1",children:pe})]})]})]}),e.jsx("div",{className:"px-8 md:px-12 py-8 bg-slate-50/60 border-b border-slate-100",children:e.jsxs("div",{className:"grid lg:grid-cols-3 gap-4",children:[e.jsxs("div",{className:"lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5",children:[e.jsx("h3",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3",children:"Cliente asignado"}),e.jsx("div",{className:"font-bold text-xl text-slate-900 leading-tight",children:((fe=a.client)==null?void 0:fe.business_name)||"Cliente eliminado"}),e.jsxs("div",{className:"text-slate-600 text-sm mt-2 space-y-1",children:[e.jsx("div",{children:((ve=a.client)==null?void 0:ve.address)||"Domicilio no registrado"}),e.jsxs("div",{className:"font-mono text-xs text-slate-500",children:["RFC: ",((je=a.client)==null?void 0:je.rfc)||"XAXX010101000"]})]}),e.jsxs("div",{className:"mt-4 pt-4 border-t border-slate-200",children:[e.jsx("h4",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2",children:"Contacto asignado"}),a.contact?e.jsxs("div",{className:"text-slate-600 text-sm space-y-1",children:[e.jsx("div",{className:"font-semibold text-slate-900",children:a.contact.full_name}),e.jsx("div",{children:a.contact.position_title||"Sin puesto"}),e.jsx("div",{children:a.contact.email||"Sin correo"}),e.jsx("div",{children:a.contact.phone||"Sin teléfono"})]}):e.jsx("div",{className:"text-slate-500 text-sm",children:"Sin contacto asignado"})]})]}),e.jsxs("div",{className:"rounded-2xl border border-slate-200 bg-white p-5",children:[e.jsx("h3",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3",children:"Ejecutivo de Ventas"}),e.jsx("div",{className:"font-bold text-slate-900 text-lg",children:((we=a.user)==null?void 0:we.full_name)||"Usuario eliminado"}),e.jsx("div",{className:"text-slate-600 text-sm mt-1",children:((ye=a.user)==null?void 0:ye.email)||"Sin correo"}),e.jsxs("div",{className:"mt-5 pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1",children:[e.jsx("div",{children:"Canal: Atención comercial directa"}),e.jsx("div",{children:"Moneda: MXN"}),e.jsx("div",{children:"Impuesto aplicado: IVA 16%"})]})]})]})}),e.jsx("div",{className:"px-8 md:px-12 py-8 min-h-[280px]",children:e.jsxs("table",{className:"w-full text-left text-sm border-separate border-spacing-0",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"text-slate-900 text-xs font-bold uppercase tracking-wider",children:[e.jsx("th",{className:"py-3 pr-4 bg-slate-900 text-white rounded-l-lg",children:"Descripción / Producto"}),e.jsx("th",{className:"py-3 px-4 text-center bg-slate-900 text-white",children:"Cant"}),e.jsx("th",{className:"py-3 px-4 text-right bg-slate-900 text-white",children:"Precio Lista"}),e.jsx("th",{className:"py-3 px-4 text-right bg-slate-900 text-white",children:"Desc."}),e.jsx("th",{className:"py-3 px-4 text-right bg-slate-900 text-white",children:"Precio Unit."}),e.jsx("th",{className:"py-3 pl-4 text-right bg-slate-900 text-white rounded-r-lg",children:"Importe"})]})}),e.jsx("tbody",{children:q.map((t,i)=>{var g,b,h,u,s;const o=Number(t.quantity)||0,r=Number(t.base_unit_price||t.unit_price||t.price)||0,d=Math.min(100,Math.max(0,Number(t.discount||0))),p=Number(t.unit_price||t.price)||0,x=Number(t.total)||p*o;return e.jsxs("tr",{className:`${i%2===0?"bg-white":"bg-slate-50/70"} border-b border-slate-100`,children:[e.jsxs("td",{className:"py-4 pr-4 align-top",children:[e.jsx("div",{className:"font-bold text-slate-800 text-base leading-tight",children:((g=t.product)==null?void 0:g.name)||"Producto eliminado"}),e.jsxs("div",{className:"text-xs text-slate-500 mt-1 leading-relaxed",children:[((b=t.product)==null?void 0:b.description)||((h=t.product)==null?void 0:h.category),((u=t.product)==null?void 0:u.users_count)>0&&e.jsxs("span",{className:"ml-2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200",children:[(s=t.product)==null?void 0:s.users_count," Usuario(s)"]})]})]}),e.jsx("td",{className:"py-4 px-4 text-center text-slate-600 align-top font-mono",children:o}),e.jsxs("td",{className:"py-4 px-4 text-right text-slate-600 align-top font-mono",children:["$",r.toLocaleString("es-MX",{minimumFractionDigits:2})]}),e.jsxs("td",{className:`py-4 px-4 text-right align-top font-mono ${d>0?"text-rose-600":"text-slate-600"}`,children:[d.toLocaleString("es-MX",{maximumFractionDigits:2}),"%"]}),e.jsxs("td",{className:"py-4 px-4 text-right text-slate-600 align-top font-mono",children:["$",p.toLocaleString("es-MX",{minimumFractionDigits:2})]}),e.jsxs("td",{className:"py-4 pl-4 text-right font-bold text-slate-900 align-top font-mono",children:["$",x.toLocaleString("es-MX",{minimumFractionDigits:2})]})]},t.id)})})]})}),e.jsxs("div",{className:"px-8 md:px-12 pb-8 grid lg:grid-cols-[1fr_360px] gap-6",children:[e.jsxs("div",{className:"rounded-2xl border border-slate-200 bg-slate-50/70 p-5",children:[e.jsx("h4",{className:"text-xs font-bold uppercase tracking-wider text-slate-500 mb-3",children:"Condiciones Comerciales"}),e.jsxs("ul",{className:"space-y-2 text-sm text-slate-600",children:[e.jsxs("li",{children:["1. Esta propuesta tiene una vigencia de ",pe,"."]}),e.jsx("li",{children:"2. Los precios se expresan en MXN e incluyen descuentos aplicados por partida."}),e.jsx("li",{children:"3. El tiempo de entrega queda sujeto a disponibilidad y confirmación de inventario."}),e.jsx("li",{children:"4. Cualquier ajuste posterior deberá formalizarse mediante actualización de cotización."})]})]}),e.jsxs("div",{className:"rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",children:[e.jsx("h4",{className:"text-xs font-bold uppercase tracking-wider text-slate-500 mb-4",children:"Resumen Financiero"}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between text-slate-500 text-sm",children:[e.jsx("span",{children:"Subtotal bruto"}),e.jsxs("span",{className:"font-mono text-slate-900",children:["$",ne.toLocaleString("es-MX",{minimumFractionDigits:2})]})]}),e.jsxs("div",{className:"flex justify-between text-slate-500 text-sm",children:[e.jsx("span",{children:"Descuento"}),e.jsxs("span",{className:"font-mono text-rose-600",children:["-$",Qe.toLocaleString("es-MX",{minimumFractionDigits:2})]})]}),e.jsxs("div",{className:"flex justify-between text-slate-500 text-sm",children:[e.jsx("span",{children:"Subtotal neto"}),e.jsxs("span",{className:"font-mono text-slate-900",children:["$",$.toLocaleString("es-MX",{minimumFractionDigits:2})]})]}),e.jsxs("div",{className:"flex justify-between text-slate-500 text-sm",children:[e.jsx("span",{children:"IVA (16%)"}),e.jsxs("span",{className:"font-mono text-slate-900",children:["$",de.toLocaleString("es-MX",{minimumFractionDigits:2})]})]}),e.jsxs("div",{className:"flex justify-between items-end border-t border-slate-900 pt-3 mt-3",children:[e.jsx("span",{className:"font-bold text-slate-900 text-lg",children:"Total Neto"}),e.jsxs("span",{className:"font-bold font-mono text-slate-900 text-2xl",children:["$",et.toLocaleString("es-MX",{minimumFractionDigits:2})]})]})]})]})]}),a.notes&&e.jsxs("div",{className:"px-8 md:px-12 pb-8",children:[e.jsx("h4",{className:"text-xs font-bold uppercase tracking-wider text-slate-500 mb-2",children:"Notas Adicionales"}),e.jsx("div",{className:"bg-slate-50 p-4 rounded-xl text-sm text-slate-600 italic border border-slate-200",children:a.notes})]}),e.jsxs("div",{className:"px-8 md:px-12 pb-8 grid md:grid-cols-2 gap-6 text-sm text-slate-600",children:[e.jsxs("div",{className:"rounded-xl border border-slate-200 p-4",children:[e.jsx("p",{className:"text-xs uppercase tracking-wider text-slate-500 font-semibold mb-8",children:"Aceptación del Cliente"}),e.jsx("div",{className:"border-t border-slate-400 pt-2 text-xs text-slate-500",children:"Nombre y firma"})]}),e.jsxs("div",{className:"rounded-xl border border-slate-200 p-4",children:[e.jsx("p",{className:"text-xs uppercase tracking-wider text-slate-500 font-semibold mb-8",children:"Ejecutivo Responsable"}),e.jsx("div",{className:"border-t border-slate-400 pt-2 text-xs text-slate-500",children:((Ne=a.user)==null?void 0:Ne.full_name)||"Sin asignar"})]})]}),e.jsxs("div",{className:"bg-slate-900 text-white p-8 md:p-12 text-xs border-t border-slate-100 print:bg-white print:text-black print:border-t-2 print:border-black",children:[e.jsxs("div",{className:"flex flex-col md:flex-row justify-between items-end gap-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"font-bold mb-1 uppercase text-emerald-400 print:text-black",children:"Información de Pago"}),e.jsxs("p",{className:"leading-relaxed text-slate-400 print:text-slate-600",children:["Banco: BBVA Bancomer",e.jsx("br",{}),"Cuenta: 0123456789",e.jsx("br",{}),"CLABE: 012000001234567890",e.jsx("br",{}),"Beneficiario: Business Control S.A. de C.V."]})]}),e.jsx("div",{className:"text-right",children:e.jsxs("p",{className:"max-w-xs leading-relaxed text-slate-500 print:text-slate-600",children:["* Precios sujetos a cambio sin previo aviso.",e.jsx("br",{}),"* Tiempo de entrega sujeto a disponibilidad."]})})]}),e.jsx("div",{className:"mt-8 pt-8 border-t border-slate-800 flex justify-between items-center text-slate-600 print:border-slate-200",children:e.jsx("div",{children:"Business Control System"})})]})]})]})}export{Ft as default};

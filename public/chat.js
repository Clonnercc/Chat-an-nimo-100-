const socket = io();

function toggleMenu(){
  const menu = document.getElementById("menuOptions");
  menu.style.display = menu.style.display==="none"?"block":"none";
}

async function openProducts(){
  const res = await fetch("/products");
  const products = await res.json();
  let html="";
  products.forEach(p=>{
    html+=`
      <div>
        <img src="${p.imageUrl}" width="80">
        <h3>${p.name}</h3>
        <p>R$ ${p.price}</p>
        <button onclick="buy('${p._id}')">Comprar</button>
      </div>
    `;
  });
  document.getElementById("chat").innerHTML=html;
}

async function buy(productId){
  document.getElementById("payment").style.display="block";
  const res = await fetch("/pix-qrcode");
  const data = await res.json();
  document.getElementById("qrCode").src=data.qr;
}

function confirmPayment(){
  alert("Após pagamento, o admin confirmará e liberará o download.");
}

const socket = io();

// Chat
function sendMessage() {
  const input = document.getElementById("msgInput");
  if(input.value.trim()==="") return;
  socket.emit("message", input.value);
  input.value = "";
}

socket.on("message", msg=>{
  const chat = document.getElementById("chatMessages");
  chat.innerHTML += `<div>${msg}</div>`;
  chat.scrollTop = chat.scrollHeight;
});

// Menu
function toggleMenu(){
  const menu = document.getElementById("menuOptions");
  menu.style.display = menu.style.display==="none"?"block":"none";
}

// Produtos
async function openProducts(){
  const res = await fetch("/products");
  const products = await res.json();
  const container = document.getElementById("productsContainer");
  container.style.display="block";
  container.innerHTML="";
  products.forEach(p=>{
    container.innerHTML += `
      <div style="border:1px solid #ccc; padding:5px; margin:5px;">
        <img src="${p.imageUrl}" width="80">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <p>R$ ${p.price}</p>
        <button onclick="buyProduct('${p._id}')">Comprar</button>
      </div>
    `;
  });
}

// Comprar produto
async function buyProduct(productId){
  // Criar pedido
  const token = localStorage.getItem("token"); // Usuário logado
  await fetch("/order", {
    method:"POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": token
    },
    body: JSON.stringify({ productId })
  });
  
  // Mostrar Pix QR
  const res = await fetch("/pix-qrcode");
  const data = await res.json();
  document.getElementById("pixQRCode").src = data.qr;
  document.getElementById("paymentContainer").style.display = "block";
}

// Confirmar pagamento (manual)
function confirmPayment(){
  alert("Após pagamento, o admin confirmará o pedido e liberará o download.");
}

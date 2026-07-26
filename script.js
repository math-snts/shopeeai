// ── SPA NAVIGATION ──────────────────────────
function navigate(page, anchor) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-link[data-page]').forEach(l => l.classList.remove('active-nav'));
  const active = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (active) active.classList.add('active-nav');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (anchor) {
    setTimeout(() => {
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }
}

// ── HOME MODAL ──────────────────────────────
function showFeature(id) {
  const modal = document.getElementById('modal');
  const content = document.getElementById('modal-content');
  let html = '';
  if (id === 2) {
    html = `<h2 class="text-3xl font-bold mb-4">Análise de Concorrência</h2>
      <p class="text-zinc-400 mb-6">Monitore preços da concorrência em tempo real e receba alertas quando houver mudanças significativas no mercado.</p>
      <button class="w-full bg-emerald-600 py-4 rounded-2xl font-semibold">Em breve</button>`;
  }
  content.innerHTML = html + `<button onclick="document.getElementById('modal').classList.add('hidden')" class="mt-4 w-full py-3 border border-zinc-700 rounded-2xl">Fechar</button>`;
  modal.classList.remove('hidden');
}
document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});

// ── PRECIFICADOR ────────────────────────────
let tipoVendedor = 'cnpj';
let modoCalculo = 'direto';   // 'direto' | 'reverso'
let modoLucro = 'valor';      // 'valor' | 'margem'
let modoAds = 'pct';          // 'pct' | 'valor'

// Faixas oficiais de comissão Shopee 2026 (percentual é igual para CNPJ e CPF;
// a taxa fixa por faixa só vale para CNPJ — no CPF a taxa fixa é única, por volume)
const FAIXAS_COMISSAO = [
  { min: 0,      max: 79.99,    percentual: 0.20, fixaCnpj: 4,  label: 'Até R$ 79,99' },
  { min: 79.99,  max: 99.99,    percentual: 0.14, fixaCnpj: 16, label: 'R$ 80 ~ R$ 99,99' },
  { min: 99.99,  max: 199.99,   percentual: 0.14, fixaCnpj: 20, label: 'R$ 100 ~ R$ 199,99' },
  { min: 199.99, max: 499.99,   percentual: 0.14, fixaCnpj: 26, label: 'R$ 200 ~ R$ 499,99' },
  { min: 499.99, max: Infinity, percentual: 0.14, fixaCnpj: 28, label: 'Acima de R$ 500' },
];

function switchTab(tipo) {
  tipoVendedor = tipo;
  const cnpj = document.getElementById('tab-cnpj');
  const cpf = document.getElementById('tab-cpf');
  if (tipo === 'cnpj') {
    cnpj.classList.add('tab-active'); cnpj.classList.remove('tab-inactive');
    cpf.classList.remove('tab-active'); cpf.classList.add('tab-inactive');
    document.getElementById('volume-group').classList.add('hidden');
  } else {
    cpf.classList.add('tab-active'); cpf.classList.remove('tab-inactive');
    cnpj.classList.remove('tab-active'); cnpj.classList.add('tab-inactive');
    document.getElementById('volume-group').classList.remove('hidden');
  }
  atualizarRegrasComissao();
}

function switchModo(modo) {
  modoCalculo = modo;
  const direto = document.getElementById('modo-direto-btn');
  const reverso = document.getElementById('modo-reverso-btn');
  const campoPreco = document.getElementById('campo-precoVenda');
  const campoLucro = document.getElementById('campo-lucro');
  if (modo === 'direto') {
    direto.classList.add('tab-active'); direto.classList.remove('tab-inactive');
    reverso.classList.remove('tab-active'); reverso.classList.add('tab-inactive');
    campoPreco.classList.remove('hidden');
    campoLucro.classList.add('hidden');
  } else {
    reverso.classList.add('tab-active'); reverso.classList.remove('tab-inactive');
    direto.classList.remove('tab-active'); direto.classList.add('tab-inactive');
    campoPreco.classList.add('hidden');
    campoLucro.classList.remove('hidden');
  }
}

function switchLucroModo(modo) {
  modoLucro = modo;
  const valorBtn = document.getElementById('lucro-valor-btn');
  const margemBtn = document.getElementById('lucro-margem-btn');
  const valorInput = document.getElementById('lucroValor');
  const margemInput = document.getElementById('lucroMargem');
  if (modo === 'valor') {
    valorBtn.classList.add('tab-active'); valorBtn.classList.remove('tab-inactive');
    margemBtn.classList.remove('tab-active'); margemBtn.classList.add('tab-inactive');
    valorInput.classList.remove('hidden'); margemInput.classList.add('hidden');
  } else {
    margemBtn.classList.add('tab-active'); margemBtn.classList.remove('tab-inactive');
    valorBtn.classList.remove('tab-active'); valorBtn.classList.add('tab-inactive');
    margemInput.classList.remove('hidden'); valorInput.classList.add('hidden');
  }
}

function toggleAds() {
  const checked = document.getElementById('usarAds').checked;
  document.getElementById('ads-fields').classList.toggle('hidden', !checked);
}

function switchAdsModo(modo) {
  modoAds = modo;
  const pctBtn = document.getElementById('ads-pct-btn');
  const valorBtn = document.getElementById('ads-valor-btn');
  const pctInput = document.getElementById('adsPct');
  const valorInput = document.getElementById('adsValor');
  if (modo === 'pct') {
    pctBtn.classList.add('tab-active'); pctBtn.classList.remove('tab-inactive');
    valorBtn.classList.remove('tab-active'); valorBtn.classList.add('tab-inactive');
    pctInput.classList.remove('hidden'); valorInput.classList.add('hidden');
  } else {
    valorBtn.classList.add('tab-active'); valorBtn.classList.remove('tab-inactive');
    pctBtn.classList.remove('tab-active'); pctBtn.classList.add('tab-inactive');
    valorInput.classList.remove('hidden'); pctInput.classList.add('hidden');
  }
}

function atualizarRegrasComissao() {
  const titulo = document.getElementById('regrasComissaoTitulo');
  const corpo = document.getElementById('regrasComissaoBody');
  if (tipoVendedor === 'cnpj') {
    titulo.textContent = 'Regras de Comissão CNPJ — 2026';
    corpo.innerHTML = FAIXAS_COMISSAO.map(f => `
      <div class="flex justify-between"><span>${f.label}</span><span class="text-zinc-200">${(f.percentual*100).toFixed(0)}% + R$ ${f.fixaCnpj.toFixed(2)}</span></div>
    `).join('');
  } else {
    const volumeCpf = document.getElementById('volumeCpf').value;
    const taxaFixaCpf = volumeCpf === 'alto' ? 7 : 4;
    titulo.textContent = 'Regras de Comissão CPF — 2026';
    corpo.innerHTML = FAIXAS_COMISSAO.map(f => `
      <div class="flex justify-between"><span>${f.label}</span><span class="text-zinc-200">${(f.percentual*100).toFixed(0)}% + R$ ${taxaFixaCpf.toFixed(2)}</span></div>
    `).join('');
  }
}
document.getElementById('volumeCpf').addEventListener('change', atualizarRegrasComissao);

function calcularComissaoBase(valor) {
  for (const f of FAIXAS_COMISSAO) {
    if (valor <= f.max) return f;
  }
  return FAIXAS_COMISSAO[FAIXAS_COMISSAO.length - 1];
}

function lerCustosComuns() {
  const custo = parseFloat(document.getElementById('custo').value) || 0;
  const aliquotaImposto = parseFloat(document.getElementById('aliquotaImposto').value) || 0;
  const afiliadoPct = parseFloat(document.getElementById('afiliadoPct').value) || 0;
  const volumeCpf = document.getElementById('volumeCpf').value;
  const taxaFixaCpf = volumeCpf === 'alto' ? 7 : 4;
  const usarAds = document.getElementById('usarAds').checked;
  const adsPct = usarAds && modoAds === 'pct' ? (parseFloat(document.getElementById('adsPct').value) || 0) : 0;
  const adsValor = usarAds && modoAds === 'valor' ? (parseFloat(document.getElementById('adsValor').value) || 0) : 0;
  return { custo, aliquotaImposto, afiliadoPct, taxaFixaCpf, adsPct, adsValor };
}

function montarLinhasResultado({ precoVenda, comissaoTotal, imposto, afiliado, ads, custo, lucro, margem, aliquotaImposto, destaquePreco }) {
  const isPositive = lucro >= 0;
  const rows = [];
  if (destaquePreco) rows.push({ label: 'Preço de Venda Sugerido', value: `R$ ${precoVenda.toFixed(2)}`, accent: true, destaque: true });
  else rows.push({ label: 'Preço de Venda', value: `R$ ${precoVenda.toFixed(2)}` });
  rows.push({ label: 'Comissão Shopee', value: `- R$ ${comissaoTotal.toFixed(2)}` });
  rows.push({ label: `Imposto (${aliquotaImposto}%)`, value: `- R$ ${imposto.toFixed(2)}` });
  if (afiliado > 0) rows.push({ label: 'Comissão de Afiliados', value: `- R$ ${afiliado.toFixed(2)}` });
  if (ads > 0) rows.push({ label: 'Custo com Ads', value: `- R$ ${ads.toFixed(2)}` });
  rows.push({ label: 'Custo do Produto', value: `- R$ ${custo.toFixed(2)}` });
  const corte = rows.length;
  rows.push({ label: 'Lucro Líquido', value: `R$ ${lucro.toFixed(2)}`, accent: true });
  rows.push({ label: 'Margem de Lucro', value: `${margem}%`, accent: true });

  document.getElementById('detalhes').innerHTML = rows.map((r, i) => `
    <div class="result-row flex justify-between items-center py-4 ${i >= corte ? 'border-t-2 border-zinc-700 mt-2 pt-6' : ''} ${r.destaque ? 'bg-blue-500/10 -mx-2 px-2 rounded-xl' : ''}">
      <span class="text-zinc-400 text-sm">${r.label}</span>
      <span class="font-bold text-base ${r.accent ? (isPositive ? 'text-emerald-400' : 'text-red-400') : 'text-white'}">${r.value}</span>
    </div>
  `).join('');

  document.getElementById('resultado').classList.remove('hidden');
  document.getElementById('placeholder-prec').classList.add('hidden');
}

function mostrarErroResultado(msg) {
  document.getElementById('detalhes').innerHTML = `
    <div class="text-center py-6">
      <i class="fa-solid fa-triangle-exclamation text-3xl text-yellow-500 mb-3"></i>
      <p class="text-zinc-300 font-medium">${msg}</p>
    </div>
  `;
  document.getElementById('resultado').classList.remove('hidden');
  document.getElementById('placeholder-prec').classList.add('hidden');
}

function calcular() {
  if (modoCalculo === 'direto') calcularDireto();
  else calcularReverso();
}

// Modo direto: usuário informa o preço de venda, calculamos o lucro real
function calcularDireto() {
  const precoVenda = parseFloat(document.getElementById('precoVenda').value) || 0;
  if (precoVenda <= 0) { alert("Por favor, informe o preço de venda."); return; }

  const { custo, aliquotaImposto, afiliadoPct, taxaFixaCpf, adsPct, adsValor } = lerCustosComuns();

  const base = calcularComissaoBase(precoVenda);
  const fixo = tipoVendedor === 'cnpj' ? base.fixaCnpj : taxaFixaCpf;
  const comissaoTotal = (precoVenda * base.percentual) + fixo;
  const imposto = precoVenda * (aliquotaImposto / 100);
  const afiliado = precoVenda * (afiliadoPct / 100);
  const ads = adsPct > 0 ? precoVenda * (adsPct / 100) : adsValor;

  const valorRecebido = precoVenda - comissaoTotal - imposto - afiliado - ads;
  const lucro = valorRecebido - custo;
  const margem = precoVenda > 0 ? (lucro / precoVenda * 100).toFixed(1) : 0;

  montarLinhasResultado({ precoVenda, comissaoTotal, imposto, afiliado, ads, custo, lucro, margem, aliquotaImposto, destaquePreco: false });
}

// Modo reverso: usuário informa custo + lucro desejado, calculamos o preço ideal
// resolvendo a equação de forma fechada em cada faixa de comissão (todas lineares em precoVenda).
function resolverPrecoIdeal(params) {
  const { custo, tipoVendedor, taxaFixaCpf, aliquotaImposto, afiliadoPct, adsPct, adsValor, modoLucro, lucroValor, margemPct } = params;
  const impostoFrac = aliquotaImposto / 100;
  const afiliadoFrac = afiliadoPct / 100;
  const adsFracPct = adsPct > 0 ? adsPct / 100 : 0;
  const adsFixo = adsPct > 0 ? 0 : adsValor;
  const margemFrac = modoLucro === 'margem' ? margemPct / 100 : 0;
  const lucroFixo = modoLucro === 'valor' ? lucroValor : 0;

  for (const faixa of FAIXAS_COMISSAO) {
    const fixoB = tipoVendedor === 'cnpj' ? faixa.fixaCnpj : taxaFixaCpf;
    const denominador = 1 - faixa.percentual - impostoFrac - afiliadoFrac - adsFracPct - margemFrac;
    if (denominador <= 0) continue;

    const precoVenda = (lucroFixo + fixoB + custo + adsFixo) / denominador;
    const dentroFaixa = precoVenda > 0 && precoVenda <= faixa.max && (faixa.min === 0 || precoVenda > faixa.min);
    if (dentroFaixa) return { precoVenda, faixa, fixoB };
  }
  return null;
}

function calcularReverso() {
  const { custo, aliquotaImposto, afiliadoPct, taxaFixaCpf, adsPct, adsValor } = lerCustosComuns();
  const lucroValor = parseFloat(document.getElementById('lucroValor').value) || 0;
  const margemPct = parseFloat(document.getElementById('lucroMargem').value) || 0;

  if (custo <= 0) { alert("Por favor, informe o custo do produto."); return; }
  if (modoLucro === 'valor' && lucroValor <= 0) { alert("Por favor, informe o lucro desejado em R$."); return; }
  if (modoLucro === 'margem' && (margemPct <= 0 || margemPct >= 100)) { alert("Por favor, informe uma margem de lucro válida (entre 0 e 100%)."); return; }

  const resultado = resolverPrecoIdeal({
    custo, tipoVendedor, taxaFixaCpf, aliquotaImposto, afiliadoPct, adsPct, adsValor,
    modoLucro, lucroValor, margemPct
  });

  if (!resultado) {
    mostrarErroResultado("Não é possível atingir esse lucro com esses custos, comissões, afiliados e Ads. Tente reduzir a margem/lucro desejado ou os custos de afiliado/Ads.");
    return;
  }

  const { precoVenda, faixa, fixoB } = resultado;
  const comissaoTotal = (precoVenda * faixa.percentual) + fixoB;
  const imposto = precoVenda * (aliquotaImposto / 100);
  const afiliado = precoVenda * (afiliadoPct / 100);
  const ads = adsPct > 0 ? precoVenda * (adsPct / 100) : adsValor;
  const valorRecebido = precoVenda - comissaoTotal - imposto - afiliado - ads;
  const lucro = valorRecebido - custo;
  const margem = (lucro / precoVenda * 100).toFixed(1);

  montarLinhasResultado({ precoVenda, comissaoTotal, imposto, afiliado, ads, custo, lucro, margem, aliquotaImposto, destaquePreco: true });
}

// ── ZPL GENERATOR ───────────────────────────
const { jsPDF } = window.jspdf;
let fileList = [];
let erros = 0, concluidas = 0;

function logStatus(msg, type = 'info') {
  const panel = document.getElementById("statusPanel");
  const line = document.createElement("div");
  const colors = { info: 'text-zinc-400', ok: 'text-emerald-400', error: 'text-red-400', warn: 'text-yellow-400' };
  line.className = colors[type] || colors.info;
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  line.textContent = `[${time}] ${msg}`;
  panel.appendChild(line);
  panel.scrollTop = panel.scrollHeight;
}

function updateStats(total) {
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statOk').textContent = concluidas;
  document.getElementById('statErr').textContent = erros;
}

function renderFileList() {
  const display = document.getElementById('fileListDisplay');
  const items = document.getElementById('fileItems');
  if (!fileList.length) { display.classList.add('hidden'); return; }
  display.classList.remove('hidden');
  items.innerHTML = fileList.map(f => `
    <div class="flex items-center justify-between bg-zinc-800/60 rounded-xl px-4 py-3">
      <div class="flex items-center gap-3">
        <i class="fa-solid fa-file-lines text-blue-400 text-sm"></i>
        <span class="text-sm text-zinc-300 truncate max-w-[180px]">${f.name}</span>
      </div>
      <span class="text-xs text-zinc-500">${(f.size/1024).toFixed(1)}KB</span>
    </div>
  `).join('');
}

function limparArquivos() {
  fileList = [];
  document.getElementById("fileInput").value = "";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressText").textContent = "Aguardando...";
  document.getElementById("eta").textContent = "--";
  document.getElementById("statusPanel").innerHTML = '<div class="text-zinc-600">Pronto para processar etiquetas...</div>';
  document.getElementById("statTotal").textContent = "0";
  document.getElementById("statOk").textContent = "0";
  document.getElementById("statErr").textContent = "0";
  erros = 0; concluidas = 0;
  renderFileList();
}

async function extrairEtiquetas(texto) {
  let etiquetas = [];
  if (texto.includes("~DGR:DEMO.GRF")) {
    const regexShopee = /~DGR:DEMO\.GRF[\s\S]*?:DEMO\.GRF\^FS\^XZ/gm;
    let match;
    while ((match = regexShopee.exec(texto)) !== null)
      etiquetas.push(match[0].trim().replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ""));
  } else {
    const regex = /\^XA[\s\S]*?\^XZ/gm;
    let match;
    while ((match = regex.exec(texto)) !== null)
      etiquetas.push(match[0].trim().replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ""));
  }
  return etiquetas;
}

async function processar() {
  const files = fileList.length ? fileList : Array.from(document.getElementById("fileInput").files);
  if (!files.length) return alert("Selecione ou arraste arquivos .txt ou .zip");

  erros = 0; concluidas = 0;
  const totalStart = Date.now();
  let etiquetas = [];
  const redeSocial = document.getElementById("redeSocial").value || "";

  logStatus("Iniciando processamento...");

  for (const file of files) {
    logStatus(`Lendo: ${file.name}`);
    if (file.name.endsWith(".zip")) {
      const data = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(data);
      for (const fname in zip.files) {
        if (fname.endsWith(".txt")) {
          const texto = await zip.files[fname].async("string");
          const found = await extrairEtiquetas(texto);
          etiquetas.push(...found);
          logStatus(`${fname}: ${found.length} etiqueta(s)`, 'ok');
        }
      }
    } else if (file.name.endsWith(".txt")) {
      const texto = await file.text();
      const found = await extrairEtiquetas(texto);
      etiquetas.push(...found);
      logStatus(`${file.name}: ${found.length} etiqueta(s)`, 'ok');
    }
  }

  if (!etiquetas.length) { logStatus("Nenhuma etiqueta encontrada.", 'error'); return; }
  logStatus(`Total: ${etiquetas.length} etiquetas`);
  updateStats(etiquetas.length);

  const pdf = new jsPDF({ unit: "mm", format: [100, 150] });
  const progressBar = document.getElementById("progressBar");

  for (let i = 0; i < etiquetas.length; i++) {
    document.getElementById('progressText').textContent = `Processando ${i+1} de ${etiquetas.length}`;
    try {
      const res = await fetch("https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "image/png" },
        body: etiquetas[i]
      });
      if (!res.ok) throw new Error("Falha Labelary");
      const blob = await res.blob();
      if (i > 0) pdf.addPage();
      const imgData = await toBase64(blob);
      pdf.addImage(imgData, "PNG", 0, 0, 100, 150);
      pdf.setFontSize(11);
      pdf.text(redeSocial, 5, 4, { align: "left" });
      pdf.text(`${i+1}/${etiquetas.length}`, 95, 4, { align: "right" });
      concluidas++;
      logStatus(`Etiqueta ${i+1} OK`, 'ok');
    } catch (e) {
      erros++;
      logStatus(`Erro etiqueta ${i+1}: ${e.message}`, 'error');
      await new Promise(r => setTimeout(r, 500));
      i--;
    }
    progressBar.style.width = ((i + 1) / etiquetas.length * 100) + "%";
    const elapsed = (Date.now() - totalStart) / (i + 1);
    const remaining = (etiquetas.length - i - 1) * elapsed / 1000;
    document.getElementById("eta").textContent = remaining > 0 ? remaining.toFixed(1) + "s restantes" : "Finalizando...";
    updateStats(etiquetas.length);
  }

  const dataStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const fileName = `etiqueta-${dataStr}-${etiquetas.length}.pdf`;
  pdf.save(fileName);
  window.open(URL.createObjectURL(pdf.output("blob")), "_blank");
  logStatus(`PDF gerado: ${fileName}`, 'ok');
  document.getElementById('progressText').textContent = "Concluído!";
  fileList = [];
}

function toBase64(blob) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onloadend = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}

document.getElementById("fileInput").addEventListener("change", (e) => {
  fileList = Array.from(e.target.files);
  renderFileList();
  logStatus(`${fileList.length} arquivo(s) selecionado(s).`);
});

const dropZone = document.getElementById("dropZone");
dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drop-zone-active"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drop-zone-active"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drop-zone-active");
  fileList = Array.from(e.dataTransfer.files);
  renderFileList();
  logStatus(`${fileList.length} arquivo(s) adicionado(s) via drag & drop.`);
});

// init
switchTab('cnpj');

// ===================================================================================
//          MÓDULO DE PRODUTOS (CATÁLOGO E CÓDIGOS)
// ===================================================================================

function renderProductsView() {
    const tbody = document.getElementById('prodViewBody');
    if (!tbody) return;
    
    const term = document.getElementById('prodViewSearch').value.toUpperCase();
    tbody.innerHTML = '';

    const sorted = productsData.sort((a, b) => a.nome.localeCompare(b.nome));

    sorted.forEach(p => {
        if (term && !p.nome.includes(term) && !(p.codigo || '').includes(term)) return;

        let loadCount = 0;
        let suppliersSet = new Set();

        patioData.forEach(truck => {
            if (truck.cargas && truck.cargas.length > 0) {
                const hasProduct = truck.cargas[0].produtos.some(prod => prod.nome === p.nome);
                if (hasProduct) {
                    loadCount++;
                    let supName = truck.empresa;
                    if (truck.supplierId) {
                        const s = suppliersData.find(x => x.id === truck.supplierId);
                        if (s) supName = s.nome;
                    }
                    suppliersSet.add(supName);
                }
            }
        });

        const suppliersArr = Array.from(suppliersSet);
        let supDisplay = suppliersArr.slice(0, 2).join(', ');
        if (suppliersArr.length > 2) supDisplay += ` e mais ${suppliersArr.length - 2}...`;
        if (suppliersArr.length === 0) supDisplay = '<span style="color:#ccc">-</span>';

        const codeDisplay = p.codigo ? `<span class="badge-code" style="font-size:1rem;">${p.codigo}</span>` : '<span style="color:#ccc; font-style:italic;">Sem Cód.</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${codeDisplay}</td>
            <td><b>${p.nome}</b></td>
            <td>${loadCount} cargas</td>
            <td style="font-size:0.85rem; color:#666;">${supDisplay}</td>
            <td>
                <button class="btn btn-edit btn-small" onclick="openCadModal('produto', '${p.id}')"><i class="fas fa-edit"></i> Editar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (tbody.innerHTML === '') {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999">Nenhum produto encontrado.</td></tr>';
    }
}

function showProductCodePopup(prodName) {
    if (!prodName) return;

    const nameUpper = prodName.toUpperCase().trim();
    const product = productsData.find(p => p.nome === nameUpper);

    const modal = document.getElementById('modalProdCode');
    const lblName = document.getElementById('popProdName');
    const lblCode = document.getElementById('popProdCode');

    if (!modal || !lblName || !lblCode) return;

    lblName.innerText = nameUpper;

    if (product && product.codigo) {
        lblCode.innerText = product.codigo;
        lblCode.style.color = "var(--primary)";
        lblCode.style.fontStyle = "normal";
    } else {
        lblCode.innerText = "NÃO CADASTRADO";
        lblCode.style.color = "#ccc";
        lblCode.style.fontSize = "1.5rem";
    }

    modal.style.display = 'flex';
}

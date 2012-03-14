function atualiza_mapa() {
	var preenchidas = 0,		// conta quantas checkboxes foram preenchidas
		i = 0,					// contador do loop
		caracteristicas = '',	// variável que armazenará a URL final do mapa
		fusion_url = 'https://www.google.com/fusiontables/embedviz?viz=MAP&q=select+col2+from+3139225+where+col4+in+(CARACTERISTICAS)&h=false&lat=-22.93949546286523&lng=-43.34304013427737&z=11&t=1&l=col2',

		// cria um array com todos os inputs da página
		inputs_obj = document.getElementsByTagName('input');

	// percorre todos os inputs coletados
	for (i = 0; i < inputs_obj.length; i++) {
		// se é um checkbox e está marcado, então...
		if (inputs_obj[i].type === 'checkbox' && inputs_obj[i].checked === true) {
			// incremente o contador e adicione o valor dele na URL.
			preenchidas++;
			caracteristicas = caracteristicas + ',\'' + inputs_obj[i].value + '\''; 
			// fica assim: ",'Ciclovia','Ciclofaixa'"
		}
	}

	if (preenchidas > 0) {
		// tira a primeira vírgula
		caracteristicas = caracteristicas.substr(1); // "'Ciclovia,'Ciclofaixa'"

		// coloca as opções escolhidas na URL do Google Fusion Tables
		fusion_url = fusion_url.replace('CARACTERISTICAS',caracteristicas);

		// faz com que o iframe carregue a URL montada.
		document.getElementById('mapa').src = fusion_url;
	} else {
		alert ('É necessário escolher ao menos uma característica para exibir o mapa.');
	}
}
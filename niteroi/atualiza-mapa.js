// Altere essas variáveis para as utilizadas pela sua Fusion Table
var FUSION_TABLE_ID = '3139225';  // ID da Fusion Table utilizada
var LATITUDE = '-22.8825';        // latitude,
var LONGITUDE = '-43.1164';       // longitude e
var ZOOM = '12';                  // nível de zoom iniciais da visualização do mapa
var GEO_COLUMN = '2';             // número da coluna com as informações geográficas, começando do zero
var QUERY_COLUMN = '4';           // número da coluna com as informações a serem filtradas, idem
// ou seja, terceira e quinta coluna respectivamente. Não precisa alterar nada daqui pra baixo.

function atualiza_mapa() {
	var preenchidas = 0,		// conta quantas checkboxes foram preenchidas
		i = 0,					// contador do loop
		caracteristicas = '',	// variável que armazenará a URL final do mapa
		fusion_url = 'https://www.google.com/fusiontables/embedviz?viz=MAP&q=select+col' + GEO_COLUMN + '+from+' + FUSION_TABLE_ID + '+where+col' + QUERY_COLUMN + '+in+(CARACTERISTICAS)&h=false&lat=' + LATITUDE + '&lng=' + LONGITUDE + '&z=' + ZOOM + '&t=1&l=col' + GEO_COLUMN;

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
		//document.getElementById('mapa').src = fusion_url;
		parent.mapa.location = fusion_url;
	} else {
		alert ('É necessário escolher ao menos uma característica para exibir o mapa.');
	}
}

function checkAll(field) {
	for (i = 0; i < field.length; i++)
		field[i].checked = true;
}

function uncheckAll(field) {
	for (i = 0; i < field.length; i++)
		field[i].checked = false;
}
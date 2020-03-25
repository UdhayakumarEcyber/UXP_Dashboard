function init() {
    let el = $('.uxp-body .uxp-content .gridster .uxp-dashboard-container');
    let gridster = el.gridster({

        widget_margins:[10,10],
        min_rows:4,
        min_cols:4,
        widget_base_dimensions:[150,150],
        widget_selector:'div.uxp-widget',
        resize:{
            enabled:true,
            stop:()=>saveDashboard(window.G)

        },
        serialize_params:function(w,wgd) {
            return {col:wgd.col,row:wgd.row,width:wgd.size_x,height:wgd.size_y,id:w.data('card-id'),type:w.data('type')};
        },
        draggable:{
            stop:()=>saveDashboard(window.G)
        },

    }).data('gridster');
    window.G = gridster;
    setTimeout(()=>{

        loadCardsFromConfig(gridster,__ServiceData__.dbconfig);
        checkForNewItems();
    },500);
}
function loadUXPDialog(hr) {
    let app = $(hr).attr('app');
    let view = $(hr).attr('view');
    if (!app) {
        app = 'System';
        view = 'sandbox-' + view;
    }
    ServiceDesk.loadRemoteFormInLayer(app,view,{});
}
function saveDashboard(gridster) {
    let dashboard = JSON.stringify(gridster.serialize());
    console.log('Saving dashboard',gridster.serialize());
    let lastCard = $Data('latest','CardKey');
    let lastLink = $Data('latest','LinkKey');
    ServiceDesk.executeService('UXP','UserData:Update',{
        'UserKey':__loggedin_user_key__,
        'Dashboard':dashboard,
        'LastCard':lastCard,
        'LastLink':lastLink
    },function(data){
        console.log('Saved dashboard');
    });
}
function saveMetrics() {
    let lastCard = $Data('latest','CardKey');
    let lastLink = $Data('latest','LinkKey');
    ServiceDesk.executeService('UXP','UserData:Update',{
        'UserKey':__loggedin_user_key__,
        'LastCard':lastCard,
        'LastLink':lastLink
    },function(data){
        console.log('Saved stats');
    });
}
function loadUseCaseCards(cards,callback) {
    let card = cards.pop();
    loadUseCaseCard(window.G,card[0],card[1],function(){
        if (cards.length > 0) {
            loadUseCaseCards(cards,callback);
        } else {
            if (callback) callback();
        }
    });
}
function loadUseCaseCard(gridster,useCaseID,cardID,callback) {
    ServiceDesk.executeService('UseCaseManager','UseCaseCard:CardContent',{'UseCaseID':useCaseID,'CardID':cardID},function(data){
        if (data.length == 0) {
            alert('No such card');
            return;
        }
        let content = unescapeScripts( data[0].Code);
        let width =  xint(data[0].Width);
        let height = xint(data[0].Height);
        // let w = $(content);
        console.log('getting card');
        //gridster.add_widget(w.get(0),width,height);
        let w = addWidget(gridster,content,width,height);
        w.data('card-id',useCaseID + '/' + cardID);
        w.data('type','usecase');
        if (callback) callback();
    });
}
function showMenu() {
    $('.blurry').makeVisible();
    $('.uxp-menu-options').makeVisible();
}
function hideMenu() {
    $('.uxp-menu-options').makeInvisible();
    $('.blurry').makeInvisible();
}
function checkForNewItems() {
    let lastSeenCard = xint($Data('dashboard','LastCard'));
    let latestCard = xint($Data('latest','CardKey'));
    if (latestCard > lastSeenCard) {
        setTimeout(showNewCardBubble,1000);
    }
    saveMetrics();
}
function showNewCardBubble() {
    $('.new-cards-info').makeVisible();
    setTimeout(() => {
        $('.new-cards-info').addClass('visible');
    }, 200);
}
function closeMe(hr) {
    $(hr).parents('.has-closer').makeInvisible();
    $(hr).parents('.has-closer').removeClass('visible');
    $('.blurry').makeInvisible();
}
function unescapeScripts(code) {
    if (!code) return '';
    return code.replace('< /script>','</script>');
}
function addWidget(gridster,code,size_x,size_y,col,row) {
    let parts = $(code);
    let el = parts.get(0);
    if (parts.length>1) {
        for(var i=1;i<parts.length;i++) {
            let script = parts.get(i);
            if(script.tagName.toUpperCase()=='SCRIPT') {
                console.log('adding script',script);
                $('body').append(script);
            }
        }
    }
    return gridster.add_widget(el,size_x,size_y,col,row);
}
function loadCardsFromConfig(gridster,config) {
    if (!config || config.length == 0) {
        $('.empty-dashboard').makeVisible();
        return;
    } else {
        $('.empty-dashboard').makeInvisible();
    }
    let cards=[];
    for (let i = 0; i < config.length; i++) {
        const card = config[i];
        //let w = $(card.Code);
        let width = xint(card.Width);
        let height = xint(card.Height);
        let id = card.ID;
        let type =card.Type;
        let row = xint(card.Row);
        let col = xint(card.Col);
        //w.data('card-id',id);
        //w.data('type',type);
        cards.push({el:unescapeScripts(card.Code),col,row,size_x:width,size_y:height,id:card.ID,type:card.Type});
        // gridster.add_widget(w.get(0),width,height,col,row);

    }
    cards = Gridster.sort_by_row_and_col_asc(cards);
    async function delay(ms) {
        return new Promise((dope,nope)=>{
            setTimeout(()=>dope(),ms);
        });
    }
    async function loadEm(cardConfig) {
        for (let i = 0; i < cardConfig.length; i++) {
            const card = cardConfig[i];
            let code = card.el;
            let el = addWidget(gridster,code,card.size_x,card.size_y,card.col,card.row);
            // let el = gridster.add_widget(card.el,card.size_x,card.size_y,card.col,card.row);
            
            el.data('card-id',card.id);
            el.data('type',card.type);
            console.log('Adding',card.id,card.col,card.row);
            await delay(1);
            
        }   
    }
    /*
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        let el = gridster.add_widget(card.el,card.size_x,card.size_y,card.col,card.row);
        el.data('card-id',card.id);
        el.data('type',card.type);
        
    }*/
    loadEm(cards).then(()=>{});
}
function serializeCards(gridster) {

}
function testDialog() {
    ServiceDesk.loadRemoteFormInLayer('System','sandbox-outlook-slack-configuration',{});
}
function updateSelectedCardStatus() {
    var btn = $('.card-browser .adder');
    var selected = $('.card-browser .card-block.selected');
    if (selected.length > 0) {
        btn.text(`Add ${selected.length}`);
        btn.removeClass('hidden');
    } else {
        btn.addClass('hidden');
    }
}
function addSelectedCards() {
    var selected = $('.card-browser .card-block.selected');
    let cards = [];
    selected.each(function(){
        var el = $(this);
        let id = el.data('card-id');
        cards.push(id.split('/'));
        // loadUseCaseCard(window.G,id.split('/')[0],id.split('/')[1]);
    });
    loadUseCaseCards(cards,function(){
        $('.empty-dashboard').makeInvisible();
        $('.card-browser').makeInvisible();
        $('.blurry').makeInvisible();
        saveDashboard(window.G);
    });
}

function browseCards() {
    let el = $('.card-browser');
    el.addClass('loading');
    el.makeVisible();
    $('.blurry').makeVisible();
    let cardList = el.find('.card-list');
    cardList.html('');
    let existingCards = window.G.serialize();
    let cardMap = {};
    for (let i = 0; i < existingCards.length; i++) {
        const card = existingCards[i];
        cardMap[card.id] = true;
        
    }
    ServiceDesk.executeService('UXP','UserData:AllCards',{},function(cards){
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            let cardBlock = $('<div ><div class="bg"></div></div>');
            cardBlock.addClass('card-block');
            cardBlock.find('.bg').css('backgroundImage',`url(${card.Icon})`);
            let txt = $('<div />');
            txt.addClass('text');
            txt.text(card.Name);
            cardBlock.append(txt);
            cardBlock.data('card-id',card.ID);
            if (cardMap[card.ID]) {
                cardBlock.addClass('installed');
            } else {
                cardBlock.touchClick((e)=>{
                    e.preventDefault();
                    e.stopPropagation();
                    cardBlock.toggleClass('selected');
                    updateSelectedCardStatus();
                });
            }
            cardList.append(cardBlock);

        }
        el.removeClass('loading');
    });

}
$(function(){
    init();
})
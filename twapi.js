var TW2 = TW2 || (function() {
    'use strict';
    
    var version = '1.00',
        schemaVersion = 1.00,
        debug = true,

    checkInstall = function() {
        if( ! _.has(state,'TW2')) {
            state.TW2=state.TW2 || {};
		}
		initialize();
    },
    
    initialize = function(){
        state.TW2={
            shots:state.TW2.shots || {},
            vehicles:state.TW2.vehicles || {},
            crew:state.TW2.crewdamage || {}
        };
    },


    inputHandler = function(msg_orig) {
        //must be roll20AM to start all this
        if (msg_orig.content.indexOf('!tw2')!==0){
            return;
        }
        
        var msg = _.clone(msg_orig),cmdDetails,args,player,who

        who = getObj('player', msg.playerid).get('displayname');

        if (playerIsGM(msg.playerid)) {
            who = 'GM'
        }
        who = 'Joe'

		if(_.has(msg,'inlinerolls')){//calculates inline rolls
			msg.content = inlineExtract(msg);
		}
		
        //splits the message contents into discrete arguments
		args = msg.content.split(/\s+--/);
	    if(args[0] === '!tw2'){
            if(args[1]){
                _.each(_.rest(args,1),(cmd) =>{
                    cmdDetails = cmdExtract(cmd);
                    if (debug){
                        log(cmdDetails)
                    }
                    if (cmdDetails.action == 'personnel' || cmdDetails.action == 'vehicle' || cmdDetails.action == 'indirect' || cmdDetails.action == 'secondary') {
                        commandHandler(cmdDetails,who)
                    }
                    if (cmdDetails.action == 'addvehicle') {
                        addVehicle(cmdDetails,who)
                    }     
                    if (cmdDetails.action == 'showvehicles') {
                        showVehicles(cmdDetails,who)
                    }                     
                    if (cmdDetails.action == 'clearvehicles') {
                        clearVehicles(who)
                    }    
                    if (cmdDetails.action == 'clearvehicle') {
                        clearVehicle(cmdDetails,who)
                    }                      
                    if (cmdDetails.action == 'clearshots') {
                        clearShots()
                    }     
                    if (cmdDetails.action == 'lastbattle') {
                        lastbattle(cmdDetails,who)
                    }                        
                 })    
            }
    	}
	}, 
    //Extracts the command details from a command string passed from handleInput	
	cmdExtract = function(cmd){
	    var cmdSep = {
	        details:{}
	    },
	    vars,
	    raw,
	    command,
	    details;
        if (debug){
            log('Command Extract')
            log('Command String:' + cmd)
        }    
        
        //split the commands from the tracks or playlists
        raw = cmd.split('|')
        command = raw[0];

        //find the action and set the cmdSep Action
	    cmdSep.action = command.match(/personnel|vehicle|indirect|addvehicle|showvehicles|clearvehicles|clearshots|secondary|lastbattle/);
        //the ./ is an escape within the URL so the hyperlink works.  Remove it
        command.replace('./', '');
        //split additional command actions
	    _.each(command.replace(cmdSep.action+',','').split(','),(d)=>{
            vars=d.match(/(character|name|id|firetype|title|weapon|mode|strength|asset|aimed|callshot|range|weaponrange|ss|burst|pulls|rof|cover|bodyarmor|damage|pens|penm|penl|pene|scope|scoperange|cws|ballistics|team|ts|tf|tr|hf|hs|hr|susp|floor|roof|crew|passengers|autoloader|remoteturret|vehicletype|size|ta|cc|br|indirecttype|fs|fc|facing|turreted|shield|resistant|he|reactive|ra|targets|corrective|targettype|hits|if|indirectrange|indirectype|c0targets|c10targets|c20targets|c30targets|c40targets|c50targets|c60targets|c70targets|c80targets|c90targets|c100targets|tonr|toffr|conr|coffr|cw|stability|tsrrb|tslrb|hsrrb|hslrb|load|cargo|shooters|terrain|attackers|defenders|vehiclecallshot|)(?:\:|=)([^,]+)/) || null;
            if(vars){
                cmdSep.details[vars[1]]=vars[2];
            }else{
                cmdSep.details[d]=d;
            }
        });

        return cmdSep;
	},

    lastbattle = function(cmdDetails,who) {
        var i,roll,output='',tohit=0,hits=0,tosave=0,saves=0
        
		output = setInlineCSS();
	    output += '<div class="sheet-rolltemplate-twilight"> '
        output += '<div class="sheet-rt-card"> '    
	    output += '<div class="sheet-rt-header sheet-relative sheet-attack">'
        output += '<div class="sheet-rt-subheader">Last Battle</div>'
        output += '<div class="sheet-rt-title sheet-pad-l-xl sheet-pad-r-xl">'+cmdDetails.details.attackers+'</div>'
        output += '</div>'   
      
        output += addHTML('Range',cmdDetails.details.range,null,null,null);
        output += addHTML('Terrian',cmdDetails.details.terrain,null,null,null);
        
        if (cmdDetails.details.range == 'Short'){
            tohit = 4
        } else if (cmdDetails.details.range == 'Medium'){
            tohit = 2
        } else  if (cmdDetails.details.range == 'Long'){
            tohit = 1
        } else if (cmdDetails.details.range == 'Extreme'){
            tohit = 0
        } 
        
        if (cmdDetails.details.attackers == 'Elite') {        
            tohit = tohit + 2
        } else if (cmdDetails.details.attackers == 'Veteran') {
            tohit = tohit + 1
        } else if (cmdDetails.details.attackers == 'Novice') {
            tohit = tohit - 1
        }    
        
        if (cmdDetails.details.terrain == 'Rubble') {        
            tohit = tohit - 1
        } else if (cmdDetails.details.terrain == 'Tower') {
            tohit = tohit - 2
        } else if (cmdDetails.details.terrain == 'Building') {
            tohit = tohit - 2
        }  
        output += addHTML('To Hit:',tohit,null,null,null)

        for (i=0;i<=cmdDetails.details.shooters;i++) {
            roll = Math.floor((Math.random() * 6) + 1);
            if (roll <= tohit) {
                hits = hits + 1
            }
        }
        output += addHTML('Hits:',hits,null,'green',null)


        if (cmdDetails.details.defenders == 'Elite'){
            tosave = 3
        } else if (cmdDetails.details.defenders == 'Veteran'){
            tosave = 2
        } else  if (cmdDetails.details.defenders == 'Experienced'){
            tosave = 1
        } else if (cmdDetails.details.defenders == 'Novice'){
            tosave = 0
        } 
        output += addHTML('To Save:',tosave.toString(),null,null,null)
         
        for (i=0;i<=hits;i++) {
            roll = Math.floor((Math.random() * 6) + 1);
            if (roll <= tosave) {
                saves = saves + 1
            }
        }
        output += addHTML('Saves:',saves.toString(),null,null,null)
        output += addHTML('Kills:',hits-saves,null,'red',null)
        
        roll = Math.floor((Math.random() * 6) + 1);
        if (roll <= hits-saves) {
            output += addHTML('Disordered',null,null,'red',null)
        }
        output += '</div>' 
        output += '</div>' 
        output += '</div>' 
        sendChat(who,output,null,{noarchive:true});
    },
    
    clearVehicle = function(cmdDetails,who) {
        state.TW2.vehicles[cmdDetails.details.id] = {}
    },

    clearVehicles = function(who) {
        state.TW2.vehicles = {}
    },
    
    clearShots = function() {
        state.TW2.shots = {}
        log(state.TW2.shots)
    },
    
    rFun = function(obj, newObj){
        Object.keys(obj).sort().forEach(key=>{
            if(typeof obj[key] === 'object'){
                newObj[key] = {};
                newObj[key] = rFun(obj[key], newObj[key]);
            } else {
                newObj[key] = obj[key];
            }
        });
        return newObj;
    },
    

    showVehicles = function(cmdDetails,who) {
        var output='',hyperlink,sortedVehicles={};
        
        JSON.stringify(rFun(state.TW2.vehicles, sortedVehicles));

        hyperlink = '!tw2 '
        
        if (cmdDetails.details.title == 'Small Arms') {
            hyperlink += '--personnel,title=Small Arms,'
            hyperlink += 'pens='+cmdDetails.details.pens+','
            hyperlink += 'penl='+cmdDetails.details.penl+','
            hyperlink += 'pene='+cmdDetails.details.pene+','            
        } else  if (cmdDetails.details.title == 'Direct Fire') {
            hyperlink += '--vehicle,title=Direct Fire,'
            hyperlink += 'pens='+cmdDetails.details.pens+','
            hyperlink += 'penm='+cmdDetails.details.penm+','
            hyperlink += 'penl='+cmdDetails.details.penl+','
            hyperlink += 'pene='+cmdDetails.details.pene+','             
        } else if (cmdDetails.details.title == 'Secondary Explosion'){
            hyperlink += '--secondary,title=Secondary Explosion,'
            hyperlink += 'pens='+cmdDetails.details.pens+','
            hyperlink += 'penm='+cmdDetails.details.penm+','
            hyperlink += 'penl='+cmdDetails.details.penl+','
            hyperlink += 'pene='+cmdDetails.details.pene+','              
        } else  {
            hyperlink += '--indirect,title=Indirect Fire,'
            hyperlink += 'pens='+cmdDetails.details.pens+','
        }
        
        hyperlink += 'firetype=Anti-Vehicle,'
        hyperlink += 'character='+encodeURIComponent(cmdDetails.details.character)+','
        hyperlink += 'weapon='+encodeURIComponent(cmdDetails.details.weapon)+','
        hyperlink += 'mode='+cmdDetails.details.mode+','
        hyperlink += 'strength='+cmdDetails.details.strength+','
        hyperlink += 'asset='+cmdDetails.details.asset+','
        hyperlink += 'aimed='+cmdDetails.details.aimed+','
        hyperlink += 'callshot='+cmdDetails.details.callshot+','
        hyperlink += 'vehiclecallshot='+cmdDetails.details.vehiclecallshot+','
        hyperlink += 'weaponrange='+cmdDetails.details.weaponrange+','
        hyperlink += 'range='+cmdDetails.details.range+','
        hyperlink += 'ss='+cmdDetails.details.ss+','
        hyperlink += 'burst='+cmdDetails.details.burst+','
        hyperlink += 'pulls='+cmdDetails.details.pulls+','
        hyperlink += 'rof='+cmdDetails.details.rof+','
        hyperlink += 'range='+cmdDetails.details.range+','
        hyperlink += 'facing='+cmdDetails.details.facing+','
        hyperlink += 'damage='+cmdDetails.details.damage+','
        hyperlink += 'cws='+cmdDetails.details.cws+','
        hyperlink += 'ballistics='+cmdDetails.details.ballistics+','
        hyperlink += 'team='+cmdDetails.details.team+','
        hyperlink += 'fc='+cmdDetails.details.fc+','
        hyperlink += 'shooters='+cmdDetails.details.shooters+','
        hyperlink += 'cover='+cmdDetails.details.cover+','
        hyperlink += 'bodyarmor='+cmdDetails.details.bodyarmor+','
        hyperlink += 'ta='+cmdDetails.details.ta+','
        
        log(hyperlink)
        output = setInlineCSS();
	    output += '<div class="sheet-rolltemplate-twilight"> '
        output += '<div class="sheet-rt-card"> '    
	    output += '<div class="sheet-rt-header sheet-relative sheet-attack"> '   
	    output += '<div class="sheet-col-1 sheet-rt-subheader">'+cmdDetails.details.character+'</div>'
        output += '<div class="sheet-row">'	
  	    output += '<div class="sheet-col-1 sheet-rt-title sheet-pad-l-xl sheet-pad-r-xl">Vehicle Attack</div>'
        output += '</div>'    	    
        output += '</div>'
	    output += '<div class="sheet-main-content">' 
	    
        _.each(sortedVehicles,vehicle=>{
            output += '<div><a style="background-color:white;color:black" href="'+hyperlink+'id='+vehicle.id+'">'+vehicle.name+'</a></div>'
        });
        
        output += '</div>'    
        output += '</div>'    
        output += '</div>'    
        
        sendChat(who,output,null,{noarchive:true});
    },
    
	addVehicle = function(cmdDetails,who) {

        state.TW2.vehicles[cmdDetails.details.id] = {
            name:cmdDetails.details.name,
            id:cmdDetails.details.id,
            stability:cmdDetails.details.stability,
            fc:cmdDetails.details.fc,
            susp:cmdDetails.details.susp,
            tf:cmdDetails.details.tf,
            ts:cmdDetails.details.ts,
            tr:cmdDetails.details.tr,
            hf:cmdDetails.details.hf,
            hs:cmdDetails.details.hs,
            hr:cmdDetails.details.hr,
            floor:cmdDetails.details.floor,
            roof:cmdDetails.details.roof,
            tsrrb:cmdDetails.details.tsrrb,
            tslrb:cmdDetails.details.tslrb,
            hsrrb:cmdDetails.details.hsrrb,
            hslrb:cmdDetails.details.hslrb,           
            crew:cmdDetails.details.crew,
            passengers:cmdDetails.details.passengers,
            load:cmdDetails.details.load,
            cargo:cmdDetails.details.cargo,
            autoloader:cmdDetails.details.autoloader,
            remoteturret:cmdDetails.details.remoteturret,
            turreted:cmdDetails.details.turreted,
            shield:cmdDetails.details.shield,
            resistant:cmdDetails.details.resistant,
            vehicletype:cmdDetails.details.vehicletype
        } 
        log(state.TW2.vehicles[cmdDetails.details.id])
	},
  
 	addCrew = function(crewmember,dead,who) {

        if (!state.TW2.crewdamage[crewmember]) {
            state.TW2.crewdamage[crewmember] = {
                name:crewmember,
                dead:dead
            } 
        }    
	},   

 	addCrewDamage = function(crewmember,hitlocation,damage,who) {

        if (!state.TW2.crewdamage[crewmember][hitlocation]) {
            state.TW2.crewdamage[crewmember][hitlocation] = {
                damage:0,
                hitlocation:hitlocation
            } 
        }    
	},  
	
 	addShot = function(cmdDetails,who) {
        
        if (!state.TW2.shots[who]) {
            state.TW2.shots[who] = {
                player:who,
                cwsshot:0,
                cwsmax:0,
                balshot:0,
                balmax:0
            } 
        }    
	},
	
	inlineExtract = function(msg){
	    return _.chain(msg.inlinerolls)
				.reduce(function(m,v,k){
					m['$[['+k+']]']=v.results.total || 0;
					return m;
				},{})
				.reduce(function(m,v,k){
					return m.replace(k,v);
				},msg.content)
				.value();
	},

	commandHandler = function(cmdDetails,who){
	    var i,result,output='',tohitrange=0,rangeband,recoil=0,burstsize=0,id,multiple=false
	    
	    if (debug){
	        log ('Command Handler')
	    }
	    
	    state.TW2.crewdamage = {};

		output = setInlineCSS();
	    output += '<div class="sheet-rolltemplate-twilight"> '
        output += '<div class="sheet-rt-card"> '    
	    output += '<div class="sheet-rt-header sheet-relative sheet-attack">'
	    if (cmdDetails.details.firetype == 'Anti-Vehicle') {
	        output += '<div class="sheet-rt-subheader">'+decodeURI(cmdDetails.details.character)+'</div>'
	    } else {
	        output += '<div class="sheet-rt-subheader">'+cmdDetails.details.character+'</div>'
	    }
        
        output += '<div class="sheet-row">'	
  	    output += '<div class="sheet-col-1 sheet-rt-title sheet-pad-l-xl sheet-pad-r-xl">'+cmdDetails.details.title+'</div>'
  	    
	    
	    if (cmdDetails.details.firetype == 'Anti-Vehicle') {
	        output += '<div class="sheet-col-13-24 sheet-pad-r-sm sheet-smaller-letter-spacing sheet-rt-value">'+decodeURI(cmdDetails.details.weapon)+'</div>'
	    } else {
	        output += '<div class="sheet-col-13-24 sheet-pad-r-sm sheet-smaller-letter-spacing sheet-rt-value">'+cmdDetails.details.weapon+'</div>'
	    }        
        
        output += '</div>'               
        if (cmdDetails.action != 'indirect') {
    	    output += '<div class="sheet-row">';
            output += '<div class="sheet-col-13-24 sheet-pad-r-sm sheet-smaller-letter-spacing sheet-rt-value">'+cmdDetails.details.mode+'</div>'
            output += '</div>';    
        }    
        output += '</div>'
	    output += '<div class="sheet-main-content">' 	
        output += '<div class="sheet-col-1 sheet-center">'+cmdDetails.details.firetype+'</div>';
        
        result      = setWeapon(cmdDetails)
        tohitrange  = result.tohitrange;
        recoil      = result.recoil;
        burstsize   = result.burstsize

        if (cmdDetails.details.firetype != 'Explosive Damage' && cmdDetails.action != 'secondary') {
            output += addHTML('Target Range: ',cmdDetails.details.range,null,null,null);
            output += addHTML('Weapon Range: ',tohitrange,null,null,null);
            output += addSpacer();  
      
            if (cmdDetails.details.mode == 'Full Automatic') {
                output += addHTML('Number of Bursts:',cmdDetails.details.pulls,null,null,null)
                output += addHTML('Shots Fired:',parseInt(cmdDetails.details.pulls)*burstsize,null,null,null)
            } else {
                output += addHTML('Shots Fired:',cmdDetails.details.pulls,null,null,null)
            }              
        } else {
            output += addHTML('Hits:',cmdDetails.details.hits,null,null,null)
        } 

        output += addSpacer();  

        if (cmdDetails.details.firetype != 'Explosive Damage' && cmdDetails.action != 'secondary') {     
            for (i=1;i<=parseInt(cmdDetails.details.shooters);i++) {
                if (cmdDetails.details.shooters > 1) {
                    output += addHTML('Shooter ',i,'green','white',null)
                    multiple=true;
                }
                output += calcPulls(cmdDetails,tohitrange,recoil,burstsize,multiple,who)
            }
        } else if (cmdDetails.action == 'secondary'){
            result    = calcVehicle(cmdDetails,cmdDetails.details.id,false,'Short',who)
            output   += result.output
            
        } else if (cmdDetails.details.cc > 0 || cmdDetails.details.br > 0) {
            result      = calcExplosive(cmdDetails,false,'Short',who)
            output     += result.output
        }
        
        output += '</div>';
        output += '</div>';
        output += '</div>';	      

		sendChat(who,output,null,{noarchive:true});
	},

    setWeapon = function(cmdDetails){
        var tohitrange=0,recoil=0,burstsize=0;
        
        tohitrange  = parseInt(cmdDetails.details.weaponrange)
        if (cmdDetails.details.mode == 'Full Automatic') {
            recoil = parseInt(cmdDetails.details.burst) 
        } else {
            recoil = parseInt(cmdDetails.details.ss)
        } 
        
        if (cmdDetails.details.cws === 'on') {
            tohitrange = tohitrange + 20
        }
         
        if (cmdDetails.details.scope === 'on') {
            tohitrange = tohitrange + 15
        }
        
        if (cmdDetails.details.mode === 'Full Automatic') {
            burstsize = cmdDetails.details.rof;
        } else { 
            burstsize = 1;
        }       
        
        return {
            tohitrange:tohitrange,
            recoil:recoil,
            burstsize:burstsize
        }  
    },

	calcPulls = function(cmdDetails,tohitrange,recoil,burstsize,multiple,who){
	    var i,m,tohit,rangeband,result,misses=0,shot,id,output='',jam,misfire,cwsfailure=false,balfailure=false,flotation=0;
        
        if (cmdDetails.details.firetype == 'Anti-Vehicle') {
            id = cmdDetails.details.id;
            log(state.TW2.vehicles[id])
        }   
        
        //loop through each pull
        if (cmdDetails.details.firetype !== 'Suppression') {
            
            for (i=1; i<=parseInt(cmdDetails.details.pulls); i++) {

                if (cmdDetails.details.mode == 'Full Automatic' && !multiple) {
				    output += addHTML('Burst',i,'black','white','italic')
                }    

                result      = calcToHit(cmdDetails,tohit,tohitrange,id,recoil,i,cwsfailure,balfailure,who)
                output     += result.output
                tohit       = result.tohit
                rangeband   = result.rangeband
                cwsfailure  = result.cwsfailure
                balfailure  = result.balfailure
                
                if (tohit == 'Not Allowed' || rangeband == 'Not Allowed') {
                    return output;
                }

                result      = calcShots(cmdDetails,id,i,tohit,burstsize,rangeband,false,misses,multiple,who);
                output     += result.output
                jam         = result.jam
                misfire     = result.misfire
                tohit       = result.tohit
                misses      = result.misses
                flotation   = result.flotation
                
                if (misfire || jam) {
                     return output;
                }
            }

            if (cmdDetails.details.mode == 'Full Automatic') {
                output += addHTML('Danger Zone',null,'black','white','italic')
                misses = Math.floor(misses/2)
                if (misses > 0 ) {
                    for (m=1;m<=misses;m++) {
                        result      = calcShots(cmdDetails,id,i,tohit,1,rangeband,true,0,multiple,who);
                        output     += result.output
                        flotation   = flotation + result.flotation
                    }
                }
            }         
                        
            if (flotation > 0) {
                output += addHTML('Total flotation Hits:',flotation,'red','white')
            }
        } 

        if (cmdDetails.details.firetype === 'Suppression') {
            burstsize = Math.floor(parseInt(cmdDetails.details.pulls * cmdDetails.details.rof)/parseInt(cmdDetails.details.targets))
            
            for (i=1; i<=parseInt(cmdDetails.details.targets); i++) {
                if (!misfire && !jam) {
                    output += addHTML('Target: ',i,'blue','white','italics');
                    result       = calcToHit(cmdDetails,1,tohitrange,id,recoil,i,cwsfailure,balfailure,who)
                    output     += result.output
                    tohit       = result.tohit
                    rangeband   = result.rangeband
                    cwsfailure  = result.cwsfailure
                    balfailure  = result.balfailure                   
                    result  = calcShots(cmdDetails,id,i,1,burstsize,rangeband,false,0,multiple,who);
                    output += result.output
                    jam     = result.jam
                    misfire = result.misfire    
                }    
            }    
        } 
        
        // if (cmdDetails.details.firetype == 'Anti-Vehicle') {
        //     log('STATE CREWDAMAGE' + state.TW2.crewdamage)
        //     _.each(state.TW2.crewdamage,crew=>{
        //         log(crew)
        //       output += addHTML(crew.name,null,'blue', 'white');
        //       if (crew["Head"]) {
        //             output += addHTML('Location: ' + crew["Head"].hitlocation,'Damage: ' + crew["Head"].damage,'red','white');
        //       }
        //       if (crew["Right Arm"]) {
        //             output += addHTML('Location: ' + crew["Right Arm"].hitlocation,'Damage: ' + crew["Right Arm"].damage,'red','white');
        //       }   
        //       if (crew["Left Arm"]) {
        //             output += addHTML('Location: ' + crew["Left Arm"].hitlocation,'Damage: ' + crew["Left Arm"].damage,'red','white');
        //       }   
        //       if (crew["Chest"]) {
        //             output += addHTML('Location: ' + crew["Chest"].hitlocation,'Damage: ' + crew["Chest"].damage,'red','white');
        //       }    
        //       if (crew["Abdomen"]) {
        //             output += addHTML('Location: ' + crew["Abdomen"].hitlocation,'Damage: ' + crew["Abdomen"].damage,'red','white');
        //       }    
        //       if (crew["Left Left"]) {
        //             output += addHTML('Location: ' + crew["Left Left"].hitlocation,'Damage: ' + crew["Left Left"].damage,'red','white');
        //       }    
        //       if (crew["Right Leg"]) {
        //             output += addHTML('Location: ' + crew["Right Leg"].hitlocation,'Damage: ' + crew["Right Leg"].damage,'red','white');
        //       }                   
        //     });            
        // }
        
        return output;
	},

    calcToHit = function(cmdDetails,tohit,weaponrange,id,recoil,pull,cwsfailure,balfailure,who) {
        var result,output='',rangeband='',pulls,outofrange

        if (debug) {
            log('Calc To Hit')
        }   

        if (parseInt(cmdDetails.details.range) <= weaponrange) {
            rangeband = 'Short'
        } else if (parseInt(cmdDetails.details.range) <= weaponrange * 2) {
            rangeband = 'Medium'
        } else if (parseInt(cmdDetails.details.range) <= weaponrange * 4) {
            rangeband = 'Long'
        } else if (parseInt(cmdDetails.details.range) <= weaponrange * 8) {
            rangeband = 'Extreme'
        } else if (parseInt(cmdDetails.details.range) > weaponrange * 8) {
            rangeband   = 'Not Allowed'
            output += addHTML ('Not Allowed')
            return {
                tohit:tohit,
                rangeband:rangeband,
                output:output,
                cwsfailure:cwsfailure,
                balfailure:balfailure
            }              
        } 
        
        if (debug) {
            log('Range Band:' + rangeband)
        }    

        if (!cwsfailure) {
            result     = checkCWS(cmdDetails,who);
            output    += result.output
            cwsfailure = result.cwsfailure    
        }
        
        if (!balfailure) {
            result     = checkCWS(cmdDetails,who);
            output    += result.output
            balfailure = result.balfailure              
        }
                
        pulls = parseInt(cmdDetails.details.pulls)

        if (debug) {
            log('Pulls:' + pulls)
            log('Pull:' + pull)
        }   

        
        if (cmdDetails.details.mode == 'Full Automatic') {
            if (pulls <= 3 || (pulls == 4 && (pull == 1 || pull == 3)) || (pulls == 5 && pull == 1)) {
                if ((parseInt(cmdDetails.details.pulls) * recoil)  > parseInt(cmdDetails.details.strength)) {
                    tohit = parseInt(cmdDetails.details.asset) - ((parseInt(cmdDetails.details.pulls) * recoil) - parseInt(cmdDetails.details.strength))
                } else {
                    tohit = parseInt(cmdDetails.details.asset)
                }
                if (rangeband == 'Short') {
                    tohit = tohit; 
                } else if (rangeband == 'Medium') { 
                    tohit = tohit * .5; 
                } else if (rangeband == 'Long') {
                    tohit = tohit * .25; 
                } else if (rangeband == 'Extreme') {
                    if (cmdDetails.details.aimed == 'Y') {
                        tohit = tohit * .25
                    } else {
                        tohit = 'Not Allowed'
                        output += addHTML ('Not Allowed')
                        outofrange = true
                    }  
                }                 
            } else {
                tohit = tohit * .5; 
            }  
        } else {
            if ((parseInt(cmdDetails.details.pulls) * recoil)  > parseInt(cmdDetails.details.strength)) {
                tohit = parseInt(cmdDetails.details.asset) - ((parseInt(cmdDetails.details.pulls) * recoil) - parseInt(cmdDetails.details.strength))
            } else {
                tohit = parseInt(cmdDetails.details.asset)
            }            
            if (rangeband == 'Short') {
                tohit = tohit; 
            } else if (rangeband == 'Medium') { 
                tohit = tohit * .5; 
            } else if (rangeband == 'Long') {
                tohit = tohit * .25; 
            } else if (rangeband == 'Extreme') {
                if (cmdDetails.details.aimed == 'Y') {
                    tohit = tohit * .25
                } else {
                    tohit = 'Not Allowed'
                    output += addHTML ('Not Allowed')
                }  
            }        
        }
        
        if (debug) {
            log('To Hit:' + tohit)
        }     

        if (tohit == 'Not Allowed') {
            return {
                tohit:tohit,
                rangeband:rangeband,
                output:output,
                cwsfailure:cwsfailure,
                balfailure:balfailure
            }   
        }

        addShot(cmdDetails,who) 
        
        if (cmdDetails.details.cws === 'on' && !cwsfailure) {
            if (cmdDetails.details.aimed === 'Y' && pull == 1) {
                state.TW2.shots[who].cwsmax = 3
                state.TW2.shots[who].cwsshot = 0
            }    
            output += addHTML('CWS',null,'#B0E0E6')
        }  
        
        if (cmdDetails.details.ballistics === 'on' && !balfailure) {
            if (cmdDetails.details.aimed === 'Y' && pull == 1) {
                if (rangeband == 'Short' || rangeband == 'Medium') {
                    state.TW2.shots[who].balmax = 5
                } else {
                    state.TW2.shots[who].balmax = 3
                }    
                state.TW2.shots[who].balshot = 0
            }   
            output += addHTML('Ballistics',null,'#B0E0E6')
            if (cmdDetails.details.mode != 'Full Automatic') {
                tohit = tohit * 2
            }
        }          
 
         if (debug) {
            log('CWS Failure:'+cwsfailure)
            log('Ballistic Failure:'+balfailure)
            log('To Hit After CWS/BAL:' + tohit)
        }  

    
        if (cmdDetails.details.aimed == 'Y' && rangeband != 'Extreme') {
            if (pulls <= 2 || (pulls > 2 && pull == 1)) {
                tohit = tohit * 2
            }
        }
        
        if ((cmdDetails.details.callshot !== 'None') || (cmdDetails.details.vehiclecallshot !== 'None')) {
            tohit = tohit * .5
        }
        
        if (debug) {
            log('To Hit After Range:' + tohit)
        }
        
        if (cmdDetails.details.firetype == 'Suppression') {
            tohit = 1
        }

        if (cmdDetails.action == 'personnel' || cmdDetails.action == 'vehicle') {
            if (!cwsfailure && cmdDetails.details.cws == 'on') {
                tohit = tohit + 2
            }
            if (!balfailure && cmdDetails.details.ballistics == 'on') {
                tohit = tohit + 1
            }            
            if (!cwsfailure && cmdDetails.details.team == 'on') {
              tohit = tohit + 1
            }  
            if (cmdDetails.details.team == 'on') {
              tohit = tohit + 1
            }    
        }

        if (debug) {
            log('To Hit After Adds:' + tohit)
        } 
        
        return {
            tohit:tohit,
            rangeband:rangeband,
            output:output,
            cwsfailure:cwsfailure,
            balfailure:balfailure
        }      
    },

    checkCWS = function(cmdDetails,danger,who) {
        var roll=0,cwsfailure=false,balfailure=false,output='';
        
        if (!danger || cmdDetails.details.cws == 'on') {
            roll = Math.floor((Math.random() * 300) + 1);
            
            if (roll == 300) {
                 output += addHTML('CWS Failure',null,'transparent','red','italic')
                 cwsfailure = true
            }
        }    
 
         if (!danger || cmdDetails.details.ballistic == 'on') {
            roll = Math.floor((Math.random() * 300) + 1);
            
            if (roll == 300) {
                 output += addHTML('CWS Failure',null,'transparent','red','italic')
                 balfailure = true
            }
        }     
        return {
            output:output,
            cwsfailure:cwsfailure,
            balfailure:balfailure
        }          
    },

    calcShots = function(cmdDetails,id,pull,tohit,burstsize,rangeband,danger,misses,multiple,who){
        var i,roll,shot,output='',result,misfire=false,jam=false,outstanding=false,suppressed=false,damage=0,totaldamage=0,dead=false,serious=false,armorAV,hit,flotation=0


        if (debug) {
            log('Calc Shots')
            log('Burstsize:' + burstsize)
        }
        for (i=1;i<=burstsize;i++) {
            if (debug) {
                log('shot:' + i)
                log('To Hit:' + tohit)
            }

            if (!multiple) {
                output += addHTML('Shot',i,'lightgrey')
            }    
            
            result  = checkMisfire(cmdDetails,danger,who);
            output += result.output
            misfire = result.misfire
            jam     = result.jam

            if (!misfire && !jam) {
                tohit = adjustToHit(cmdDetails,tohit,pull,i,who)
    
                roll = Math.floor((Math.random() * 20) + 1);
                if (!multiple) {
                    output += addDualHTML('To Hit:',tohit,'Roll:',roll,'transparent','black','black','normal')
                }
                
                if (cmdDetails.action != 'indirect') {
                    if (roll <= 16 && roll <= tohit) {
                        if (roll <= (tohit - 10)) {
                            outstanding = true
                            if (!multiple) {
                                output += addHTML('Outstanding Hit',null,null,'#008000')
                            }    
                        } else {
                            outstanding = false
                            if (!multiple) {
                                //output += addHTML('Hit',null,null,'#008000')
                            }    
                        }   
                        hit = true
                    } else {    
                        hit = false
                    }    
                } else {
                     if (roll <= 14 && roll <= tohit) {
                        if (roll <= (tohit - 10)) {
                          outstanding = true
                          output += addHTML('Outstanding Hit',null,null,'#008000')
                        } else {
                            
                            outstanding = false
                            output += addHTML('Hit',null,null,'#008000')
                        }   
                        hit = true
                    } else {    
                        hit = false
                    }                  
                }
                
                if (hit) {
                    if (cmdDetails.details.firetype === 'Anti-Personnel' || cmdDetails.details.firetype === 'Suppression') {
                        if (cmdDetails.details.bodyarmor == 'Steel') {
                            armorAV = 1
                        } else if (cmdDetails.details.bodyarmor == 'Kevlar') {
                            armorAV = 2
                        } else if (cmdDetails.details.bodyarmor == 'Kevlar3') {
                            armorAV = 3      
                        } else if (cmdDetails.details.bodyarmor == 'Kevlar4') {
                            armorAV = 4                              
                        } else {
                            armorAV = 0
                        }
                        
                        if (cmdDetails.action == 'personnel' || (cmdDetails.action == 'vehicle' && parseInt(cmdDetails.details.damage) > 0)) {
                            result      = calcPersonnel(cmdDetails,outstanding,rangeband,who,cmdDetails.details.damage,cmdDetails.details.cover,armorAV,dead)
                            output     += result.output
                            damage      = result.damage
                            dead        = result.dead
                        }    
    
                        if (!dead) {
                            totaldamage = totaldamage + damage 
                            result      = checkDeath(who,totaldamage)
                            output     += result.output
                            dead        = result.dead       
                        }    
                    }   
    
                    if (cmdDetails.details.firetype === 'Anti-Vehicle') {
                        result    = calcVehicle(cmdDetails,id,outstanding,rangeband,who)
                        output   += result.output
                        flotation = flotation + result.flotation
                    }  
                } else {
                    if (!multiple) {
                        output += addHTML('Missed',null,null,'red') 
                    }    
                    if (cmdDetails.action == 'indirect') {
                        output  += calcDeviation(cmdDetails,rangeband,who)                   
                    }              
                    misses = misses + 1
                }   

                roll = Math.floor((Math.random() * 6) + 1);
                if (roll == 6) {
                    suppressed = true 
                }
                //output += addSpacer()
            }    
        }  
        
        if (!dead) {
            result  = checkSerious(who,totaldamage)
            output += result.output
            serious = result.serious
        }  
            
        if (cmdDetails.details.firetype !== 'Anti-Vehicle' && !dead && !serious) {
            if (suppressed) {
                output += addHTML('Suppressed',null,'transparent','red','italic')
            }
            if (totaldamage > 0) {
                roll = Math.floor((Math.random() * 6) + 1);
                output += addHTML('Panic Check',roll)  
            }   
        }
        
        return {
            output:output,
            misfire:misfire,
            jam:jam,
            tohit:tohit,
            misses:misses,
            flotation:flotation
        }   
    },
   
    checkMisfire = function(cmdDetails,danger,who) {
        var roll=0,jam=false,misfire=false,output='';
        
        if (danger || (cmdDetails.action == 'vehicle' && cmdDetails.details.mode !== 'Full Automatic') || cmdDetails.action == 'indirect') {
            jam = false
            misfire = false
        } else {   

            roll = Math.floor((Math.random() * 500) + 1);
            
            if (debug) {
                log ('Jam Roll:' + roll)
            }
            if (roll == 499) {
                output += addHTML('Misfire',null,'transparent','red','italic')
                misfire = true
            } 
            if (roll == 500) {
                 output +=addHTML('Jam',null,'transparent','red','italic')
                jam = true
            }
        }    
    
        return {
            output:output,
            jam:jam,
            misfire:misfire
        }          
    },
    
    adjustToHit = function(cmdDetails,tohit,pull,shot,who) {

        if (debug) {
            log ('Adjust To Hit')
            log ('Original To Hit:' + tohit)
            log('Pull:' + pull)
            log('Shot:' + shot)
        }
        
        if (cmdDetails.action != 'vehicle') {
            if (cmdDetails.details.aimed === 'Y' && cmdDetails.details.cws != 'on' && cmdDetails.details.ballistics != 'on') {
                if (shot > 1) {
                   // tohit  = tohit/2;
                }
            }               
            if (cmdDetails.details.mode == 'Full Automatic') {
                if (shot > 1) {
                    tohit  = tohit/2;
                }  
            } else { 
                if (cmdDetails.details.cws == 'on') { 
                    state.TW2.shots[who].cwsshot = state.TW2.shots[who].cwsshot + 1
                    if (state.TW2.shots[who].cwsshot > state.TW2.shots[who].cwsmax) {
                        tohit  = tohit/2;
                    }     
                }  
                if (cmdDetails.details.ballistics == 'on') { 
                    state.TW2.shots[who].balshot = state.TW2.shots[who].balshot + 1
                    if (state.TW2.shots[who].balshot > state.TW2.shots[who].balmax) {
                        tohit  = tohit/2;
                    }     
                }   
            }    
        } 

        if (tohit  < 1) {
            if (cmdDetails.details.firetype == 'Suppression') {
                tohit = 1
            } else {
                tohit = 1
            }
        }    

        if (debug) {
            log ('Adjusted To Hit:' + tohit)
        }
        
        return tohit
    },
    
    calcDeviation = function(cmdDetails,rangeband,who) {
        var output='',meters,deviation,roll,weaponrange,targetrange
        
        weaponrange = parseInt(cmdDetails.details.weaponrange)
        targetrange = parseInt(cmdDetails.details.range)
        
        if (debug) {
            log('Calc Deviation')
            log('Weapon Range:' + weaponrange)
            log('Target Range:' + targetrange)
        }
        roll = Math.floor((Math.random() * 10) + 1);
        
        if (cmdDetails.details.indirectype == 'Thrown') {   
            if (targetrange == 'Short') {
                meters = roll
            } else {
                meters = roll * 2      
            }
        } else if (cmdDetails.details.indirectype == 'Grenade Launcher') {
            if (targetrange <= (weaponrange / 2)) {
                meters = roll * 5
            } else {
                meters = roll * 10     
            }
        } else {
            if (targetrange <= (weaponrange / 2)) {
                meters = roll * 10
            } else {
                meters = roll * 20     
            }            
        }    
        
        roll = Math.floor((Math.random() * 10) + 1);
        
        if (roll == 1 || roll == 2) {
            deviation = 'Long'
        } else if (roll == 3) {
            deviation = 'Long Right'
        } else if (roll == 4) {
            deviation = 'Right'
        } else if (roll == 5) {
            deviation = 'Short Right'
        } else if (roll == 6 || roll == 7) {
            deviation = 'Short'
        } else if (roll == 8) {
            deviation = 'Short Left'        
        } else if (roll == 9) {
            deviation = 'Left'    
        } else if (roll == 10) {
            deviation = 'Long Left'    
        }
        
        output += addHTML('Deviates:',deviation,null,'red')
        output += addHTML('Meters:',meters,null,'red')
        
        return output
    },
    
    calcPersonnel = function(cmdDetails,outstanding,rangeband,who,damagedice,coverAV,armorAV,dead){
        var roll=0,output='',hitlocation='',missed=false,result='',damage=0,pen;
        
        if (dead) {
            return {
                output:output,
                damage:damage,
                dead:dead
            }              
        }

        if (debug) {
            log('Calc Personnel')
            log('Outstanding:' + outstanding)
            log('Rangeband:' + rangeband)
            log('Cover AV:' + coverAV)
            log('Armor AV:' + armorAV)
        }
        
        result      = calcHitLocation(cmdDetails)
        output     += result.output
        hitlocation = result.hitlocation

        result      = calcArmor(cmdDetails,hitlocation,getPenetration(cmdDetails,rangeband),damagedice,armorAV)
        output     += result.output
        damagedice  = result.damagedice

        result      = calcCover(cmdDetails,hitlocation,getPenetration(cmdDetails,rangeband),damagedice,coverAV)
        output     += result.output
        missed      = result.missed  
        damagedice  = result.damagedice

        if (debug) {
            log('Missed:' + missed)
        }
        
        if (!missed && damagedice > 0) {
             result     = calcDamage(cmdDetails,hitlocation,outstanding,rangeband,damagedice,who) 
             output    += result.output
             damage     = result.damage
             dead       = result.dead
        } 
        
        return {
            output:output,
            damage:damage,
            dead:dead,
            hitlocation:hitlocation
        }    
    },
    
    calcHitLocation = function(cmdDetails) {
        var roll,hitlocation,output=''

        if (debug) {
            log('Hit Location')
            log('Callshot:' + cmdDetails.details.callshot)
        }
        
        if (cmdDetails.details.callshot === 'None') {
            roll = Math.floor((Math.random() * 10) + 1);
            if (roll == 1) {
                hitlocation = 'Head'
            } else if (roll == 2) {
                hitlocation = 'Right Arm'
            } else if (roll == 3) {
                hitlocation = 'Left Arm'
            } else if (roll == 4) {
                hitlocation = 'Chest'
            } else if (roll == 5 || roll == 6) {
                hitlocation = 'Abdomen'
            } else if (roll == 7 || roll == 8) {
                hitlocation = 'Right Leg'
            } else { 
                hitlocation = 'Left Leg'
            }
        } else {
            hitlocation = cmdDetails.details.callshot
 //           cmdDetails.details.callshot = 'None'
        }    
        output     += addHTML('Hit Location:',hitlocation,null,'#008000')            
        
        if (debug) {
            log('Hit location:' + hitlocation)
        }   
        
        return {
            output:output,
            hitlocation:hitlocation
        }    
    },
      
    getPenetration = function(cmdDetails,rangeband) {
        var pen='',pointer
        
        if (debug) {
            log('Get Penetration')
            log('Rangeband:' + rangeband)
        }          

        if (cmdDetails.action == 'indirect') {
            pen = cmdDetails.details.pens  
        } else if (cmdDetails.action == 'personnel') {
            if (rangeband === 'Short' || rangeband == 'Medium') {
                pen = cmdDetails.details.pens    
            } 
        } else {
            if (rangeband === 'Short') {
                pen = cmdDetails.details.pens    
            }   
            if (rangeband === 'Medium') {
                pen = cmdDetails.details.penm    
            }              
        }    
        if (rangeband === 'Long') {
            pen = cmdDetails.details.penl 
        }      
        if (rangeband === 'Extreme') {
            pen = cmdDetails.details.pene 
        } 
                
        if (pen.includes('C')) {
            pointer = pen.indexOf('C')
            pen = pen.substr(0,pointer)
        }

        if (debug) {
            log('Penetration:' + pen)
        }    
        
        return pen
    },
    
    calcArmor = function (cmdDetails,hitlocation,pen,damagedice,armorAV) {
        var roll=0,output='',armor=false
 
        if (debug) {
            log('Calc Armor')
        }
        
        if (armorAV > 0) {
            if (hitlocation === 'Head'){
                roll = Math.floor((Math.random() * 6) + 1);
                if (cmdDetails.details.bodyarmor == 'Steel' && roll <= 3){
                    armor = true    
                } 
                if (cmdDetails.details.bodyarmor == 'Kevlar' && roll <= 4){
                    armor = true  
                }
            } else if (hitlocation === 'Chest' || hitlocation === 'Abdomen') {
                armor = true
            }
        }    
            
        if (debug) {
            log('Armor:' + armor)
        }  

        if (armor) {  
            output += addHTML('Hit Armor',null,null,'red')
            if (pen === 'N'){
                damagedice = 0;
                output += addHTML('Damage:',1,null,'red')
            } else {    
                if (cmdDetails.action == 'personnel') {
                    damagedice = damagedice - (parseInt(pen) * armorAV)
                } else {
                    damagedice = damagedice - armorAV
                }    
                
            }    
        }
        
        if (debug) {
            log('Damage Dice:' + damagedice)
        }                   
        
        return {
            output:output,
            damagedice:damagedice
        }  
    },

    calcCover = function (cmdDetails,hitlocation,pen,damagedice,coverAV) {
        var roll=0,output='',missed=false,cover=false
 
        if (debug) {
            log('Calc Cover')
            log('Pen:' + pen)
            log('Cover:' + coverAV)
            log('Hitlocation:' + hitlocation)
        }

        if (hitlocation === 'Abdomen' || hitlocation === 'Right Leg' || hitlocation === 'Left Leg') {
            if (coverAV === 'Prone') {
                missed = true
                output += addHTML('Missed Prone Target',null,null,'red','italic')
            } 
            if (coverAV !== 'None' && coverAV != 'Prone'){
              cover = true
            }    
        }   
        
        if (debug) {
            log('Missed:' + missed)
        }      
        
        if (cover && !missed) {
            output += addHTML('Hit Cover',null,null,'red')
            if (pen === 'N'){
                damagedice = 0;
            }  else {
                if (cmdDetails.action == 'personnel') {
                    damagedice = damagedice - (parseInt(pen) * parseInt(coverAV))
                } else {
                    damagedice = damagedice - parseInt(coverAV)
                }
            }   
            if (debug) {
                log('Damage Dice:' + damagedice)
            }             
        } 
                  
        
        return {
            output:output,
            damagedice:damagedice,
            missed:missed
        }  
    },    
    
    calcDamage = function(cmdDetails,hitlocation,outstanding,rangeband,damagedice,who) {
        var i,roll=0,damage=0,pen=0,output='',dead=false,result;
 
        if (debug) {
            log('Calc Damage')
        }

        for (i=1;i<=damagedice;i++) {
            roll = Math.floor((Math.random() * 10) + 1);
            damage = damage + roll;
        }
        
        if (outstanding) {
            damage = damage * 2
        }

        if (debug) {
            log('Damage:' + damage)
        }   
        
        output += addHTML('Damage:',damage,null,'red')

        if (hitlocation === 'Head' || hitlocation === 'Chest') {
            roll = Math.floor((Math.random() * 20) + 1);
            if (roll <= damage) {
                output += addHTML('Dead',null,'red','white')
                dead = true
            } 
            if (roll > damage) {   
                roll = Math.floor((Math.random() * 6) + 1);     
                output += addHTML('Stun Check:',damage+roll,null,'red','italic')
            }                
        }   
        
        result      = checkDeath(who,damage)
        output     += result.output
        dead        = result.dead    

        if (debug) {
            log('Dead:' + dead)
        } 
        
        return {
            output:output,
            dead:dead,
            damage:damage
        }    
    },
    
    extractAV = function(AV) {
        var pointer=0,finalav,start,end
        
        pointer = AV.indexOf('cp')
        if (pointer > 0) {
            start=0
            end=pointer
            finalav = AV.substr(start,end)
        } else {
            pointer = AV.indexOf('sp')
            if (pointer > 0) {
                start = 0
                end = pointer 
                finalav = parseInt(AV.substr(start,end))
            } else {
                if (AV.includes('T')) {
                    finalav = parseInt(AV.substr(1))
                } else {
                    finalav = parseInt(AV)
                }    
            }    
        }
        
        return finalav
    },
    
    calcVehicle = function(cmdDetails,id,outstanding,rangeband,who) {
        var roll=0,output='',hitlocation=null,hitdetails=null,roof=false,result='',flotation=0;

        if (debug) {
            log('Calc Vehicle')
            log('ID:' + id)
        }    

        if (cmdDetails.details.ta == 'on') {
            output += addHTML('Overhead Hit',null,null,'green')
            roof = true
        }  else if (cmdDetails.details.title == 'Indirect Fire') {
            output += addHTML('Overhead Hit',null,null,'green')
            roof = true
            
            if (state.TW2.vehicles[id].vehicletype == 'Vessel') {
                roll = Math.floor((Math.random() * 4) + 1);
                if (roll == 1) {
                    hitdetails = 'Front'
                } else if (roll == 2) {
                    hitdetails = 'Right Side'
                } else if (roll == 3) {
                    hitdetails = 'Left Side'                    
                } else {
                    hitdetails = 'Rear'
                }    
            }    
        }    

        if (cmdDetails.details.vehiclecallshot!= 'None') {
            if (state.TW2.vehicles[id].vehicletype == 'Vehicle') {
                hitlocation = cmdDetails.details.vehiclecallshot
            } else {
                if (state.TW2.vehicles[id].vehicletype == 'Turret') {
                    hitlocation = 'Superstructure'
                }                
                if (state.TW2.vehicles[id].vehicletype == 'Hull') {
                    hitlocation = 'Hull'
                }
                if (state.TW2.vehicles[id].vehicletype == 'Suspension') {
                    hitlocation = 'Waterline'
                }                
            }     
        
        } else {
            roll = Math.floor((Math.random() * 6) + 1);
        
            if (roof || cmdDetails.details.facing == 'Side') {
                roll = roll + 1;
            }
    
            if (state.TW2.vehicles[id].vehicletype == 'Vehicle') {
                if (roll == 1 || roll == 2 || roll == 3) {
                    hitlocation = 'Hull'
                } else if (roll == 4 || roll == 5) {
                    if (state.TW2.vehicles[id].turreted == 'Y') {    
                        hitlocation = 'Turret'
                    } else {
                        hitlocation = 'Hull'
                    }    
                } else {
                    hitlocation = 'Suspension'
                } 
            } else {
                if (roll <= 3) {
                    hitlocation = 'Hull'
                } else if (roll == 4 || roll == 5) {
                    if (state.TW2.vehicles[id].turreted == 'Y') {    
                        hitlocation = 'Superstructure'
                    } else {
                        hitlocation = 'Hull'
                    }    
                } else {
                    hitlocation = 'Waterline'
                }                
            }    
        }    

        if (roof && (hitlocation == 'Suspension' || hitlocation == 'Waterline')) {
            hitlocation = 'Hull'
        }
    
        if (!hitdetails) {
            hitdetails = cmdDetails.details.facing
        }

        output = addHTML('Hit ' + hitdetails + ' ' + hitlocation,null,null,'green')

        if (debug) {
            log('Location:' + hitlocation)
            log('Details:' + hitdetails)
        }   
        
        result    = calcVehicleDamage(cmdDetails,id,hitlocation,hitdetails,outstanding,rangeband,roof,who)
        output   += result.output
        flotation = result.flotation;
        
        return {
            output:output,
            flotation:flotation
        }    
    },

    calcVehicleDamage = function(cmdDetails,id,hitlocation,hitdetails,outstanding,rangeband,roof,who){
        var i,damagedice=0,roll=0,damage=0,result,major=0,minor=0,pen,av,output='',flotation=0

        if (debug) {
            log('Calc Vehicle Damage')
        }           
        
        pen = getPenetration(cmdDetails,rangeband)

        if (debug) {
            log('Attacking Pen:' + pen)
        }          
        
        if (roof) {
            av = state.TW2.vehicles[id].roof
        } else {
            if (hitlocation === 'Hull') {
                if (hitdetails === 'Front') {
                    av = state.TW2.vehicles[id].hf
                } else if (hitdetails.includes('Side')) {    
                    av = state.TW2.vehicles[id].hs 
                } else {
                    av = state.TW2.vehicles[id].hr
                }    
            } else if (hitlocation === 'Turret') {
                if (hitdetails === 'Front') {
                    av = state.TW2.vehicles[id].tf
                } else if (hitdetails.includes('Side')) {    
                    av = state.TW2.vehicles[id].ts 
                } else {
                    av = state.TW2.vehicles[id].tr
                }    
            } else {
                av = state.TW2.vehicles[id].susp
            }
        }    

        if (debug) {
            log('Vehicle AV:' + av)
        }   
        
        if (cmdDetails.action == 'personnel') {
            if (pen != 'N') {
                av = extractAV(av)
                if (debug) {
                    log('Vehicle AV:' + av)
                }                  
                damagedice  = parseInt(cmdDetails.details.damage) - (pen * av)
                if (debug) {
                    log('Damage Dice:' + damagedice)
                }                     
                if (damagedice > 0) {
                    for (i=1;i<=parseInt(cmdDetails.details.damage);i++) {
                        roll = Math.floor((Math.random() * 10) + 1);
                        damage = damage + roll;
                    }
                } 
            }    
        } else {
            damage = calcPenetration(cmdDetails,pen,av) 
        }
        
        if (debug) {
            log('Damage:' + damage)
        }         
        
        if (damage > 0)
        {
            if (outstanding) {
                damage = damage * 2
            }  
            output += addHTML('Penetration:',damage,null,'red')

            if (damage > 0 && damage <= 10) {
                minor = 1
            } else if (damage >= 11 && damage <= 20) {
                minor = 2
            } else if (damage >= 21 && damage <= 31) {
                minor = 3                
            } else if (damage >= 31 && damage <= 40) {
                major = 1
            } else if (damage >= 41 && damage <= 60) {
                major = 2
            } else {
                major = 3
            }   
            
            if (debug) {
                log('Minor:' + minor)
                log('Major:' + major)
            }    
            
            if (minor > 0) {
                result    = calcMinorDamage(cmdDetails,hitlocation,minor,id,rangeband,damage,who)
                output   += result.output
                flotation = result.flotation
                major     = major + result.major
            }
            
            if (major > 0) {
                result    = calcMajorDamage(cmdDetails,hitlocation,major,id,rangeband,damage,who)
                output   += result.output
                flotation = result.flotation
            }
            roll = Math.floor((Math.random() * 6) + 1);
            output += addHTML('Panic Check:',roll,null,'red')
        } else {
            output += addHTML('No Penetration',null,null,'red')
        }  
        
        return { 
         output:output,
         flotation:flotation
        } 
    },
 
    calcMinorDamage = function(cmdDetails,hitlocation,minor,id,rangeband,damage,who) {
        var i,roll=0,major=0,output='',result,flotation=0

        if (debug) {
            log('Calc Minor Damage')
            log('Hit Location:' + hitlocation)
        }
        
        for (i=1;i<=minor;i++) {
            roll = Math.floor((Math.random() * 6) + 1);          

            if (debug) {
                log('Minor Roll:' + roll)
            }
            
            if (state.TW2.vehicles[id].vehicletype === 'Vehicle') {
                if (hitlocation == 'Hull') {
                    if (roll == 1) {
                        output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who)
                    } else if (roll == 2) {  
                        if (state.TW2.vehicles[id].autoloader == 'Y') { 
                            output += calcFailure('Autoloader',damage)
                        } else {
                            output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who) 
                        }    
                    } else if (roll == 3 || roll == 4) {  
                        if (state.TW2.vehicles[id].passengers > 0) {
                            output += calcCrewDamage(cmdDetails,id,'Passenger',rangeband,who) 
                            output += calcCrewDamage(cmdDetails,id,'Passenger',rangeband,who)
                        } else {
                            output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who)
                        }
                    } else if (roll == 5) {  
                        output += calcFailure('Radio',damage)
                    } else {
                        major = major + 1;
                    }
                }
                if (hitlocation == 'Turret') {
                    if (roll == 1) {
                        if (state.TW2.vehicles[id].autoloader == 'Y') { 
                            output += calcFailure('Autoloader',damage)
                        } else {
                            output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who) 
                        }   
                    } else if (roll == 2) {
                        if (state.TW2.vehicles[id].remoteturret == 'Y') {
                            output += calcFailure('Sensor', damage)
                        } else {
                            output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who)
                        }     
                    } else if (roll == 3) {  
                        output += calcFailure('Sight',damage)
                    } else if (roll == 4) {  
                        output += calcFailure('Traverse',damage)
                    } else if (roll == 5) {  
                        output += calcFailure('Secondary',damage)
                    } else {
                        major = major + 1;
                    }
                }    
                if (hitlocation == 'Suspension') {
                    if (damage > (state.TW2.vehicles[id].susp.substr(1,1) * 2)) {
                        output += addHTML('Vehicle Immobilized',null,'red', 'white')
                    } else {
                        output += addHTML('Vehicle Speed Halved',null,'#F08080')
                    }   
                }    
            } else {
                if (hitlocation == 'Hull') {
                    if (roll == 1 || roll == 2) {
                        output += calcCrewDamage(cmdDetails,id,null,rangeband,who)
                    } else if (roll == 3 || roll == 4) {  
                        output += calcFailure('Auxillary',damage)
                    } else if (roll == 5) {  
                        output += calcFailure('Secondary',damage)
                    } else {
                        major = major + 1;
                    }
                }
                if (hitlocation == 'Superstructure') {
                    if (roll == 1) {
                        output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who)
                    } else if (roll == 2) {
                        output += calcFailure('Sensor',damage)
                    } else if (roll == 3) {  
                        output += calcFailure('Sight',damage)
                    } else if (roll == 4 || roll == 5) {  
                        output += calcFailure('Traverse',damage)
                    } else {
                        major = major + 1;
                    }
                } 
                if (hitlocation == 'Waterline') {
                    output += addHTML('Flotation Hits',Math.floor(damage/6),'red', 'white')
                    flotation = flotation + Math.floor(damage/6)
                }                  
            }    
        } 
        return {
            output:output,
            major:major,
            flotation:flotation
        }    
    },
    
    calcMajorDamage = function(cmdDetails,hitlocation,major,id,rangeband,damage,who) {
        var i,roll=0,output='',flotation=0

        if (debug) {
            log('Calc Major Damage')
        }
        
        for (i=1;i<=major;i++) {
            roll = Math.floor((Math.random() * 6) + 1);            
            if (state.TW2.vehicles[id].vehicletype === 'Vehicle') {
                if (hitlocation == 'Hull') {
                    if (roll == 1 || roll == 2) {
                        output += calcFailure('Engine',damage)
                    } else if (roll == 3 || roll == 4) {  
                        output += calcExplosion('Fuel',damage)
                    } else {
                        output += calcExplosion('Ammo',damage)
                    }
                }
                if (hitlocation == 'Turret') {
                    if (roll == 1 || roll == 2) {
                        if (state.TW2.vehicles[id].remoteturret='Y') {
                            output += calcFailure('Main Armament',damage)
                        } else {
                            output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who)
                            output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who)
                        }
                    } else if (roll == 3 || roll == 4) {
                        output += calcFailure('Main Armament',damage)
                    } else if (roll == 5) {  
                        output += calcExplosion('Ammo',damage)
                    } else {
                        output += calcFailure('Traverse',damage)
                    }
                }    
            } else {
                if (hitlocation == 'Hull') {
                    if (roll == 1 || roll == 2) {
                        output += calcFailure('Main Armament',damage)
                    } else if (roll == 3 || roll == 4) {  
                        output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who)
                        output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who)
                    } else if (roll == 5) {  
                        output += calcExplosion('Ammo',damage)
                    } else {
                        output += addHTML('Fire',null,'red','white')
                    }
                }
                if (hitlocation == 'Superstructure') {
                    if (roll == 1 || roll == 2) {
                        output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who)
                        output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who)
                    } else if (roll == 3 || roll == 4) {  
                        output += addHTML('Fire',null,'red','white')
                    } else if (roll == 5) {  
                        output += calcExplosion('Ammo',damage)
                    } else {
                        output += calcFailure('Bridge',damage)
                    }
                }  
                if (hitlocation == 'Waterline') {
                    if (roll == 1) {
                        output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who)
                        output += calcCrewDamage(cmdDetails,id,'Crewmember',rangeband,who)
                    } else if (roll == 2) {  
                        output += calcFailure('Rudder/Screw',damage)
                    } else if (roll == 4) {  
                        output += calcExplosion('Fuel',damage)
                    } else if (roll == 5) {  
                        output += calcExplosion('Ammo',damage)                        
                    } else {
                        output += addHTML('Flotation Hits',Math.floor(damage/6),'red', 'white')
                        flotation = flotation + Math.floor(damage/6)
                    }
                }                 
            }  
        }   

        return {
            output:output,
            flotation:flotation
        }    
    },   
    
    calcCrewDamage = function(cmdDetails,id,crewmember,rangeband,who) {
        var i,roll=0,damageroll=0,damage=0,dead=false,crew=0,passengers=0,crewdamage=0,output='',result,target,hitlocation,armorAV=0;
        
        crew       = state.TW2.vehicles[id].crew
        passengers = state.TW2.vehicles[id].passengers
        
        if (cmdDetails.details.bodyarmor == 'Steel') {
            armorAV = 1
        } else if (cmdDetails.details.bodyarmor == 'Kevlar') {
            armorAV = 2
        } else if (cmdDetails.details.bodyarmor == 'Kevlar3') {
            armorAV = 3      
        } else if (cmdDetails.details.bodyarmor == 'Kevlar4') {
            armorAV = 4                              
        } else {
            armorAV = 0
        }  
        
        if (crewmember == 'Crewmember') {
            roll = Math.floor((Math.random() * crew) + 1); 
            target = 'Crewmember' + roll 
        } else {
            roll = Math.floor((Math.random() * passengers) + 1); 
            target = 'Passenger' + roll 
        }

        output += startDiv('lightgrey')
        output += addHTML(target,null,'blue', 'white')
        
        if (debug) {
            log('Calc Crew Damage')
            log('Crew: ' + crew)
            log('Passengers: ' + passengers)
            log('Crewmember: ' + target)
        }
        
        roll = Math.floor((Math.random() * 6) + 1); 
        
        for (i=1;i<=roll;i++) {
            
            if (!dead) {
                result      = calcPersonnel(cmdDetails,false,rangeband,who,1,cmdDetails.details.cover,armorAV)
                damage     += result.damage
                dead        = result.dead
                hitlocation = result.hitlocation
                output     += result.output
            }    
            
            // if (!dead) {
            //     result      = checkDeath(who,damage)
            //     dead        = result.dead 
            //     output     += result.output
            // }                
        }  
                
        output += addHTML('Total Damage',damage,'red', 'white')     
        if (!dead) {
            result      = checkDeath(who,damage)
            dead        = result.dead 
            output     += result.output
        }      
        if (!dead) {
            result = checkSerious(who,damage)
            output     += result.output
        }        
        
        output += endDiv()
        
        return output
    },

    calcPenetration = function(cmdDetails,pen,AV) {
        var roll=0,pointer=0,cover=false,cp=false,sp=false,start=0,end=0,finalav=0,penetration=0,finalpenetration=0;    
        
        if (debug) {
            log('Calc Penetration')   
        }  
        
        finalav = extractAV(AV)

        pointer = pen.indexOf('C')
        if (pointer > 0) {
            end = pointer 
            penetration = pen.substr(start,end)
        }  else {
            penetration = pen
        }

        if (debug) {
            log('Extracted AV:' + finalav)
            log('Extracted Penetration:' + penetration) 
        }        

        if (AV.includes('cp') && cmdDetails.details.he === 'on') {
            penetration = (parseInt(penetration) * 0.5) + Math.floor((Math.random() * 6) + 1); 
        } else if (AV.includes('sp') && cmdDetails.details.he === 'on') {
            penetration = parseInt(penetration) + Math.floor((Math.random() * 6) + 1); 
        } else {
            penetration = parseInt(penetration) + Math.floor((Math.random() * 6) + 1) + Math.floor((Math.random() * 6) + 1); 
        }
        
        if (cmdDetails.details.ra > 0 && cmdDetails.details.he === 'on') {
            roll = Math.floor((Math.random() * 100) + 1)
            
            if (roll <= (cmdDetails.details.ra * 10)) {
                output += addHTML('Hit Reactive Armor Block',null,null,'red')
                finalav = parseInt(finalav) + 80
                
                roll = Math.floor((Math.random() * 10) + 1)
                output += addHTML(roll + ' Reactive Armor Blocks Destroyed',null,null,'red')
            }
        }
        
        finalpenetration = penetration - finalav

        if (debug) {
            log('Final AV:' + finalav)
            log('Penetration:' + penetration) 
            log('Final Penetration:' + finalpenetration)   
        }   
        
        return finalpenetration;
    },     
    
    calcExplosion = function(location,damage) {
        var output='',roll=0;
        
        roll = Math.floor((Math.random() * 100) + 1);
        
        output += addHTML(location + ' Hit',null,'red','white')
        if (debug) {
            log ('Explosion Roll:' + roll)
        }
        
        if (roll <= damage) {
            output += addHTML('Explosion!',null,'red','white')
        } 
        
        return output;
    },
 
     calcFailure = function(location,damage) {
        var output='',roll=0;
        
        roll = Math.floor((Math.random() * 100) + 1);
        
       if (debug) {
            log ('Failure Roll:' + roll)
        }
        
        if (roll <= damage/2) {
            output += addHTML(location,' Destroyed','red', 'white')
        } else if (roll <= damage) {
            output += addHTML(location,' Damaged','red', 'white')
        } else {
            output += addHTML(location,' Not Damaged','green', 'white')
        }      
        
        return output;
    },
    
    calcExplosive = function(cmdDetails,outstanding,rangeband,who) {
        var i,cc,ccdamage=0,damage=0,dead=false,serious=false,totaldamage=0,result,roll=0,output=''

        if (debug) {
            log ('Calc Explosive')
        }
            
        cc = parseInt(cmdDetails.details.cc)
        
        for (i=1;i<=cc;i++) {
            ccdamage = ccdamage + Math.floor((Math.random() * 10) + 1)
        }

        if (debug) {
            log ('CC Damage:' + ccdamage)
        }
        
        for (i=1;i<=parseInt(cmdDetails.details.c0targets);i++) {
            if (debug) {
                log ('TARGET:' + i)
            }            
            output     += addHTML('0 Meter Target ' + i + ' (Concussive)',null,'black','white')
            totaldamage = 0
            dead        = false

            result      = calcPersonnel(cmdDetails,outstanding,rangeband,who,cc,'None','None')
            output     += result.output
            damage      = result.damage
            dead        = result.dead        
            
            if (!dead) {
                output  += calcConcussive(cmdDetails,ccdamage,0,who)
            }
        }  

        for (i=1;i<=parseInt(cmdDetails.details.c10targets);i++) {
            output += addHTML('10 Meter Target ' + i + ' (Concussive)',null,'black','white')
            output += calcConcussive(cmdDetails,ccdamage,10,who)
        }     

        ccdamage = Math.floor(ccdamage/2)
        if (debug) {
            log ('CC Damage - 20 Meters:' + ccdamage)
        }         
        
 //       if (ccdamage > 0) {
            for (i=1;i<=parseInt(cmdDetails.details.c20targets);i++) {
                output += addHTML('20 Meter Target ' + i + ' (Concussive)',null,'black','white')
                output += calcConcussive(cmdDetails,ccdamage,20,who)
            }     
//        }    

        ccdamage = Math.floor(ccdamage/2)
 //       if (ccdamage > 0) {
            for (i=1;i<=parseInt(cmdDetails.details.c30targets);i++) {
                output += addHTML('30 Meter Target ' + i + ' (Concussive)',null,'black','white')
                output += calcConcussive(cmdDetails,ccdamage,30,who)
            }     
 //       }
 
        ccdamage = Math.floor(ccdamage/2)
//        if (ccdamage > 0) {
            for (i=1;i<=parseInt(cmdDetails.details.c40targets);i++) {
                output += addHTML('40 Meter Target ' + i + ' (Concussive)',null,'black','white')
                output += calcConcussive(cmdDetails,ccdamage,40,who)
            }     
//        }    

        ccdamage = Math.floor(ccdamage/2)
//        if (ccdamage > 0) {
            for (i=1;i<=parseInt(cmdDetails.details.c50targets);i++) {
                output += addHTML('50 Meter Target ' + i + ' (Concussive)',null,'black','white')
                output += calcConcussive(cmdDetails,ccdamage,50,who)
            }     
//        }
        
        ccdamage = Math.floor(ccdamage/2)
//        if (ccdamage > 0) {
            for (i=1;i<=parseInt(cmdDetails.details.c60targets);i++) {
                output += addHTML('60 Meter Target ' + i + ' (Concussive)',null,'black','white')
                output += calcConcussive(cmdDetails,ccdamage,60,who)
            }     
//        }
        
        ccdamage = Math.floor(ccdamage/2)
//        if (ccdamage > 0) {
            for (i=1;i<=parseInt(cmdDetails.details.c70targets);i++) {
                output += addHTML('70 Meter Target ' + i + ' (Concussive)',null,'black','white')
                output += calcConcussive(cmdDetails,ccdamage,70,who)
            }     
//        }
       
        ccdamage = Math.floor(ccdamage/2)
//        if (ccdamage > 0) {
            for (i=1;i<=parseInt(cmdDetails.details.c80targets);i++) {
                output += addHTML('80 Meter Target ' + i + ' (Concussive)',null,'black','white')
                output += calcConcussive(cmdDetails,ccdamage,80,who)
            }     
//        }
        
        ccdamage = Math.floor(ccdamage/2)
//        if (ccdamage > 0) {
            for (i=1;i<=parseInt(cmdDetails.details.c90targets);i++) {
                output += addHTML('90 Meter Target ' + i + ' (Concussive)',null,'black','white')
                output += calcConcussive(cmdDetails,ccdamage,90,who)
            }     
 //       }
        
 //       ccdamage = Math.floor(ccdamage/2)
//        if (ccdamage > 0) {
            for (i=1;i<=parseInt(cmdDetails.details.c100targets);i++) {
                output += addHTML('100 Meter Target ' + i + ' (Concussive)','black','white')
                output += calcConcussive(cmdDetails,ccdamage,100,who)
            }     
//        }
        
        return {
            output:output,
            damage:damage,
            dead:dead,
            serious:serious
        }
    },

    calcConcussive = function (cmdDetails,ccdamage,meters,who) {
        var i,damage=0,roll=0,totaldamage=0,output='',result,dead=false,serious=false,prone=false,primary=true
 
        if (debug) {
            log ('Calc Concussive')
            log ('CC Damage:' + ccdamage)
        }
        
        roll = Math.floor((Math.random() * 100) + 1);
        if (meters <= parseInt(cmdDetails.details.br)) {
            if (roll <= 25) {
                prone    = true
                output  += addHTML('Target goes prone',null,null,'blue')
            }           
        } else {
             if (roll <= 50) {
                prone    = true
                output  += addHTML('Target goes prone',null,null,'blue')
            }               
        }
        
        if (debug) {
            log ('Prone:' + prone)
        }

        if (prone) {
            ccdamage = Math.floor(ccdamage/2)
        }
                        
        damage = Math.floor(ccdamage/7);
        if (debug) {
            log ('CC Damage:' + ccdamage)
            log ('Loc Damage:' + damage)
        }        
        
        totaldamage = damage*7
        output     += addHTML('Concussive (to each location):',damage,null,'red')
        output     += addHTML('Total Damage:',damage*7,null,'red')

        result      = checkDeath(who,totaldamage)
        output     += result.output
        dead        = result.dead    

        if (!dead) {
            if (parseInt(cmdDetails.details.br) >= meters) {
                 primary     = true
            } else if ((parseInt(cmdDetails.details.br) * 2) >= meters) {
                primary     = false
            } 
            
            if (debug) {
                log ('Primary:' + primary)
            }
            
            result      = calcFragmentation(cmdDetails,primary,prone,who)
            output     += result.output
            damage      = result.damage
            dead        = result.dead     
            
            totaldamage = totaldamage + damage
            result      = checkDeath(who,totaldamage)
            output     += result.output
            dead        = result.dead                
        }

        if (!dead) {
            result      = checkSerious(who,totaldamage)
            output     += result.output
        }
        
        return output
    },
    
    calcFragmentation = function(cmdDetails,primary,prone,who) {
        var i,roll=0,frags=0,chance,result,output='',damage=0,dead=false,totaldamage=0,armorAV=0

        if (debug) {
            log ('Calc Fragmentation')
        }
        
        if (cmdDetails.details.bodyarmor == 'Steel') {
            armorAV = 1
        } else if (cmdDetails.details.bodyarmor == 'Kevlar') {
            armorAV = 2
        } else if (cmdDetails.details.bodyarmor == 'Kevlar3') {
            armorAV = 3      
        } else if (cmdDetails.details.bodyarmor == 'Kevlar4') {
            armorAV = 4                              
        } else {
            armorAV = 0
        }        
        
        output     += addHTML('Fragmentation',null,'#B0E0E6')
        
        roll = Math.floor((Math.random() * 10) + 1);

        if (debug) {
            log ('Frag Roll:' + roll)
        }
        
        if (primary) {
            if (roll <= 3) {
                frags = Math.floor((Math.random() * 6) + 1);
            } else if (roll <= 6) {
                frags = 1
            } else {
                frags = 0
            }
        }  else {
            if (roll <= 2) {
                frags = Math.floor((Math.random() * 6) + 1);
            } else if (roll <= 4) {
                frags = 1
            } else {
                frags = 0
            }            
        }  
        if (debug) {
            log ('Frags:' + frags)
        }        
        if (frags == 0) {
            output += addHTML('No Fragmentations Hit',null,null,'red')
        }
        
        for (i=1;i<=frags;i++) {
            
            if (!dead) {
                if (primary) {
                    if (prone) {
                        result = calcPersonnel(cmdDetails,false,'Short',who,2,'Prone',armorAV)
                    } else {
                        result = calcPersonnel(cmdDetails,false,'Short',who,2,cmdDetails.details.cover,armorAV)
                    }
                 
                } else {

                    if (prone) {
                        result = calcPersonnel(cmdDetails,false,'Short',who,1,'Prone',armorAV)
                    } else {
                        result = calcPersonnel(cmdDetails,false,'Short',who,1,cmdDetails.details.cover,armorAV)
                    }   
                }    
                output     += result.output
                damage      = result.damage
                dead        = result.dead                   
            }    
            
            if (!dead) {
                totaldamage = totaldamage + damage
                result      = checkDeath(who,totaldamage)
                output     += result.output
                dead        = result.dead  
            }
        } 
        
        return {
            output:output,
            damage:totaldamage,
            dead:dead
        }
    },

    checkDeath = function(who,totaldamage) {
        var dead=false,output=''
        
        if (who != 'GM' && totaldamage >= 40) {
            output += addHTML('Dead',null,'red','white')
            dead    = true
        }    
        
        return {
            output:output,
            dead:dead
        }
    },

    checkSerious = function(who,totaldamage) {
        var serious=false,output=''
        
        if (who != 'GM' && totaldamage >= 20) {
            serious = true
            output += addHTML('Serious',null,'red','white')
        } else if (who != 'GM' && totaldamage > 0) {
            serious = false
            output += addHTML('Slight',null,'red','white')
        }   
        
        return {
            output:output,
            serious:serious
        }
    },
    
	setInlineCSS = function(){
	    var css='';
	    
        css +=  '<style> '	    
        css +=  '    .sheet-rolltemplate-whfrp2e .sheet-rt-key, '
        css +=  '    .sheet-rolltemplate-whfrp2e .sheet-rt-key-wide { '
        css +=  '    font-weight: bold; '
        css +=  '    font-family: Arial, Helvetica, sans-serif; '
        css +=  '    font-size: 1.1em; ' 
        css +=  '    text-indent: 4px; '
        css +=  '    -moz-text-decoration-color: #D79340; '
        css +=  '    text-decoration-color: #D79340; '
        css +=  '    } '
	    css +=  '    [class^="sheet-col"], '
        css +=  '    .sheet-rolltemplate-whfrp2e [class^="sheet-col"] { '
        css +=  '	display: inline-block; '
        css +=  '	*display: inline; /* IE < 8: fake inline-block */ '
        css +=  '	zoom: 1; '
        css +=  '	letter-spacing: normal; '
        css +=  '	word-spacing: normal; '
        css +=  '	vertical-align: top; '
        css +=  '	text-rendering: auto; '
        css +=  '	margin: 0;'
        css +=  '    } '
        css +=  '	.sheet-rolltemplate-twilight { '
        css +=  '	box-sizing: border-box; '
        css +=  '	margin-left: -4px; '
        css +=  '	margin-right: -2px; '
        css +=  '	} '
        css +=  '	.textchatcontainer a[href^="!"], .textchatcontainer a[href^="~"]{ '
        css +=  '	background-color:white; '
        css +=  '	color:black; '
        css +=  '	} '       
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-card { '
        css +=  '	margin-right: 10px; '
        css +=  '	background-color:#FFFFFF; '
        css +=  '	font-size: 11px; '
        css +=  '	border-radius: 5px; '
        css +=  '	border: black 1px solid; '
        css +=  '	padding: 4px 0 2px; '
        css +=  '	box-sizing: border-box; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header { '
        css +=  '	text-align: center; '
        css +=  '	position: relative; '
        css +=  '	color: #fff; '
        css +=  '	margin: 0 -10px 4px -10px; '
        css +=  '	padding: 4px; '
        css +=  '	background-color: #5c5c5c; '
        css +=  '	background-image:  linear-gradient(rgba(255,255,255,.3), rgba(255,255,255,0)); '
        css +=  '	box-shadow: 0 2px 0 rgba(0,0,0,.3); '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header .inlinerollresult { '
        css +=  '	background: transparent; '
        css +=  '	border: none; '
        css +=  '	padding: 0; '
        css +=  '	font-weight: normal; '
        css +=  '	font-size: 1em; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .inlinerollresult { '
        css +=  '	padding: 0 2px; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header:before, '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header:after { '
        css +=  '	position: absolute; '
        css +=  '	border-style: solid; '
        css +=  '	border-color: transparent; '
        css +=  '	bottom: -10px; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header:before { '
        css +=  '	border-width: 0 10px 10px 0; '
        css +=  '	border-right-color: #222; '
        css +=  '	left: 0; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header:after { '
        css +=  '	border-width: 0 0 10px 10px; '
        css +=  '	border-left-color: #222; '
        css +=  '	right: 0; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-title { '
        css +=  '	font-size: 1.5em; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-subheader { '
        css +=  '	line-height: 120%; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-ability { '
        css +=  '	background-color: #603000; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-ability:before { '
        css +=  '	border-right-color: #603000; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-ability:after { '
        css +=  '	border-left-color: #603000; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-attack { '
        css +=  '	background-color: #902000; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-attack:before { '
        css +=  '	border-right-color: #902000; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-attack:after { '
        css +=  '	border-left-color: #902000; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-unarmed { '
        css +=  '	background-color: #504335; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-unarmed:before { '
        css +=  '	border-right-color: #504335; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-unarmed:after { '
        css +=  '	border-left-color: #503C35; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-armed { '
        css +=  '	background-color: #505050; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-armed:before { '
        css +=  '	border-right-color: #505050; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-armed:after { '
        css +=  '	border-left-color: #505050; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-explosive { '
        css +=  '	background-color: #1F1914; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-explosive:before { '
        css +=  '	border-right-color: #1F1914; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-header.sheet-explosive:after { '
        css +=  '	border-left-color: #1F1914; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-key, '
        css +=  '	.sheet-rolltemplate-twilight { '
        css +=  '	font-weight: bold;italic; '
        css +=  '	font-family: Arial, Helvetica, sans-serif; '
        css +=  '	font-size: 1.1em; '
        css +=  '	-moz-text-decoration-color: #D79340; '
        css +=  '	text-decoration-color: #D79340; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-key { '
        css +=  '	max-width: 120px; '
        css +=  '	display: inline-block; '
        css +=  '	padding-left: 2px; '
        css +=  '	width: 52.83333%; '
        css +=  '	text-align:right; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-value { '
        css +=  '	box-sizing: border-box; '
        css +=  '	display: inline-block; '
        css +=  '	padding-right: 2px !important; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-result { '
        css +=  '	text-align: center; '
        css +=  '	position: relative; '
        css +=  '	font-size: 1.1em; '
        css +=  '	font-style;italic; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-outstanding { '
        css +=  '	text-align: center; '
        css +=  '	position: relative; '
        css +=  '	color:green; '
        css +=  '	font-style:italic; '
        css +=  '	font-size: 1.1em; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-damage { '
        css +=  '	text-align: center; '
        css +=  '	position: relative; '
        css +=  '	color:red; '
        css +=  '	font-size: 1.1em; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight .sheet-rt-catastrophic { '
        css +=  '	text-align: center; '
        css +=  '	position: relative; '
        css +=  '	color:red; '
        css +=  '	font-style:italic; '
        css +=  '	font-size: 1.1em; '
        css +=  '	} '
        css +=  '	.sheet-rolltemplate-twilight hr { '
        css +=  '	margin-top:0px;margin-bottom:0px '
        css +=  '	} '
        css +=  '</style> ';
        
        return css;      
	},
	
	startDiv = function(background) {
	    var html='';
	    
	    html = '<div style="margin-bottom:0px;background-color:'+background+'">'
	    return html;
	},
	endDiv = function(background) {
	    var html='';
	    
	    html = '</div>'
	    return html;
	},
    addHTML = function(label,value,background,color,style){
        var html='';

        if (!value) {
            value = ''
        }
        if (!background) {
            background = 'transparent'
        }
        if (!color) {
            color = 'black'
        }
        if (!style) {
            style='normal'
        }
	    html =   '<div class="sheet-row" style="margin-bottom:0px;">';
        html +=       '<div class="sheet-col-1 sheet-center" style="font-style:'+style+';color:'+color+';background-color:'+background+'">'+label+' '+value+'</div>'
        html +=   '</div>';           

        return html;        
    },
 
     addDualHTML = function(label1,value1,label2,value2,background,color1,color2,style){
        var html='';
        
	    html =   '<div style="text-align:center;background-color:'+background+'">';
        html +=       '<span style="text-align:center;font-style:'+style+';color:'+color1+'">'+label1+' '+value1+'  </span><span style="text-align:center;font-style:'+style+';color:'+color2+';background-color:'+background+'">'+label2+' '+value2+'</span>'
        html +=   '</div>';           

        return html;        
    },
    
     addSpacer = function(){
        var html='';
        html +=   '<hr>';
        return html;        
    },  	
    
    RegisterEventHandlers = function() {
        on('chat:message', inputHandler);    	    
        on('sheet:opened change:VehicleID1', function() {
	        log('made it')
	        //TW2.vehicleOptions()
				setAttrs({VehicleID: vehicleOptions()})	        

		});

 
    };     
    
    return {
        CheckInstall: checkInstall,
    	RegisterEventHandlers: RegisterEventHandlers
	}    
}());

on("ready",function(){
    'use strict';
    
    TW2.CheckInstall();
    TW2.RegisterEventHandlers();
    
});

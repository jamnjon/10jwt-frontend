import React, { Component } from 'react';
import jwtDecode from 'jwt-decode'
import { config } from './utility/Constants'
import { Button, Form, Container, Row, Col, Modal, Card, ListGroup, Popover, OverlayTrigger, Tooltip, Table, Accordion } from 'react-bootstrap';
import styles from './Profile.css'

export default class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
    user: {},
    rating: "",
    sport: "",
    sports: [],
    sportID: 0,
    sportMatches: [],
    error: "",
    changed: 0,
    username: "",
    bonusSports: []
    }

    this.handleChange = this.handleChange.bind(this);
    this.fillSportName = this.fillSportName.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
// Configure for allowing viewing other users' profiles
  componentDidMount() {
    // let user = {}
    let username = ""
    // let sports = []

    let url = config.url.BASE_URL + 'sports'
    let jwt = window.localStorage.getItem('jwt')
    if(!jwt){
      this.props.history.push('/register', {error: "You must be signed in to view a profile"})
    } else {
      let result = jwtDecode(jwt)
      if (result.username){
        username = result.username
      }
      let url2 = config.url.BASE_URL + 'users/'+result.id

    // console.log(this.props)

  // SAMPLE FETCH
    // fetch("url,
    // { method: 'POST', body: formData })
    // .then(res => res.json()).then(res => (console.log(res.jwt),
    // window.localStorage.setItem('jwt', res.jwt)))
    // .then(() => this.props.history.push('/'))
    // .catch(function(error){console.log('There is an error: ', error.message)})

      Promise.all([fetch(url), fetch(url2)])
      .then(function(responses) {
        return Promise.all(responses.map(function(response) {
          return response.json();
        }));
      }).then(function(data){
        let user = data[1].user
        let detail = 0
        let winner = '0'
        let ratingChange = 0
        if(this.props.location.state){
          detail = this.props.location.state.detail
          winner = this.props.location.state.winner
          if(user.events){
            user.sports.forEach((sport) => {
              // eslint-disable-next-line
              if(sport.id == detail){
                user.events[user.events.length - 1].team1.forEach((player) => {
                  if(player.id  === user.id){
                    ratingChange = Math.abs(player.ratingChange).toFixed(3)
                  }
                });

              }
            });
          }
        }
        this.setState({sports: data[0].sports, user, username, changed: detail, winner, ratingChange})
      }.bind(this)).catch(function(error) {
        console.log(error)
      })
    }
  }

  sortedSportsList(){
    let official = []
    let unofficial = []
    let nothingPlayed = []
    let athlete
    this.state.user.sports.forEach((sport) => {
      if (sport.id !== "10" && sport.opponents.length >=5){
        let uselessVariable
        let numGames = 0
        this.state.user.events.forEach((event) => {
          // eslint-disable-next-line
          if(event.sport == sport.id){
            numGames++
          }
        })
        sport["numGames"] = numGames
        if(numGames >= 5){
          official.push(sport)
        }
        else{
          unofficial.push(sport)
        }
      } else if (sport.id !== "10" && sport.opponents.length > 0) {
        let numGames = 0
        this.state.user.events.forEach((event) => {
          // eslint-disable-next-line
          if(event.sport == sport.id){
            numGames++
          }
        })
        sport["numGames"] = numGames
        unofficial.push(sport)
      } else if (sport.id !== "10"){
        nothingPlayed.push(sport)
      }
      else {
        athlete = sport
      }
    })
    let sports = [athlete]


    return sports.concat(this.quickSort(official), [""], this.quickSort(unofficial), [""], this.quickSort(nothingPlayed.concat(this.state.bonusSports)), [official.length])
  }
  quickSort(sports) {
    if (sports.length <= 1) {
       return sports;
       } else {
         var left = [];
         var right = [];
         var newArr = [];
         var length = sports.length - 1;
         var pivot = sports[length];
         for (var i = 0; i < length; i++) {
            if (sports[i]["rating"] >= pivot["rating"]) {
               left.push(sports[i]);
             } else {
               right.push(sports[i]);
             }
           }
       return newArr.concat(this.quickSort(left), pivot, this.quickSort(right));
    }
 }

 handleChange(event) {
   let sportMatches = [...this.state.sportMatches]
   if(event.target.name === 'sport'){
     sportMatches = this.findSports(event.target.value)
   }

   this.setState({
     [event.target.name]: event.target.value,
     sportMatches,
   });
 }

 findSports(sportName){
   let sportMatches = [];
   if(sportName.length >= 3){
     var list = this.state.sports;
     let user = this.state.user
     list.forEach(function(sport,p){
       let addedSport = false;
       let mismatch;
       [...Array((sport.name.length - sportName.length + 1) > 0 ? (sport.name.length - sportName.length + 1) : 0)].forEach((_, i) => {

          mismatch = 0;
         [...Array(sportName.length)].forEach((_,j) => {
           if(sportName[j].toUpperCase() !== sport.name[i+j].toUpperCase()){
             mismatch = mismatch + 1;
           }
         });
         if(mismatch < 2){
           var duplicate = false
           sportMatches.forEach(function(potentialSport){
             if(sport.id === potentialSport.id){
               duplicate = true
             }
           })
           if(!duplicate && sport.id !== 10){
             addedSport = true
             let alreadyRated = false
             sport.participants.forEach((participant) => {
               if(participant.id === user.id){
                 alreadyRated = true
               }
             });
             if(!alreadyRated)
             sportMatches.push({name: sport.name,id: sport.id});
           }
         }
       });
       if(sport.alternate_name && !addedSport){
         [...Array((sport.alternate_name.length - sportName.length + 1) > 0 ? (sport.alternate_name.length - sportName.length + 1) : 0)].forEach((_, i) => {


           mismatch = 0;
           [...Array(sportName.length)].forEach((_, j) => {


             if(sportName[j].toUpperCase() !== sport.alternate_name[i+j].toUpperCase()){
               mismatch = mismatch + 1;
             }
           });
           if(mismatch < 2){
              var duplicate = false
             sportMatches.forEach(function(potentialSport){
               if(sport.id === potentialSport.id){
                 duplicate = true
               }
             })
             if(!duplicate && sport.id !== 10){
               let alreadyRated = false
               sport.participants.forEach((participant) => {
                 if(participant.id === user.id){
                   alreadyRated = true
                 }
               });
               if (!alreadyRated)
               sportMatches.push({name: sport.name,id: sport.id});
             }
           }
         });
       }

     })
   }
   return sportMatches;
 }

 fillSportName(event){
   console.log(event.target.attributes)
 let sportMatches = [{
   name: event.target.attributes[1].value,
   id: event.target.attributes[0].value,
 }]
 this.setState({
   sport: event.target.attributes[1].value,
   sportID: event.target.attributes[0].value,
   sportMatches,
 })
}

 handleSubmit(event){
  event.preventDefault();
 const { sportMatches, rating, sportID, sport } = this.state
  var addThisSport
  const addUserToSport =
    {
      id: this.state.user.id,
      rating: parseFloat(rating),
      playerName: this.state.user.firstname + " " + this.state.user.lastname,
      username: this.state.user.username
    }
  let error = ""
  if(sportMatches.length > 0){
    var bold = sportMatches[0].id
    // addThisSport.append('id', sportMatches[0].id)
    // addThisSport.append('name', sportMatches[0].name)
    // addThisSport.append('rating', parseFloat(rating))
    addThisSport =
    {
      id: sportMatches[0].id,
      name: sportMatches[0].name,
      rating: parseFloat(rating)
    }
  } else if (sportID !== 0){
    bold = sportID
    // addThisSport.append('id', sportID)
    // addThisSport.append('name', sport)
    // addThisSport.append('rating', parseFloat(rating))
    addThisSport =
    {
      id: sportID,
      name: sport,
      rating: parseFloat(rating)
    }
  } else {
    error = "Invalid sport name. Verify that you don't already have a rating and haven't misspelled the name of the sport."
    this.setState({error})
  }
  if (error === ""){
    let url = config.url.BASE_URL + "users/" + this.state.user.id
    let url2 = config.url.BASE_URL + "sports/" + bold

    Promise.all([fetch(
      url,
      {method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({newSport: addThisSport})}),
      fetch(
        url2,
        {method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({newUserInSport: addUserToSport})})])
    // fetch(url,
    //   {method: 'PATCH',
    //   headers: {'Accept': 'application/json',
    // 'Content-Type': 'application/json'},
    //   body: JSON.stringify({newSport: addThisSport})})
    .then(function(responses) {
      return Promise.all(responses.map(function(response) {
        return response.json();
      }));
    }).then(function(data){
      let a = this.state.bonusSports

      a.push({
        id: sportID,
        name: sport,
        rating: parseFloat(rating),
        opponents: [],
        official: false
      })
      this.setState({bonusSports: a, changed: sportID, winner: 0, sport: "", rating: ""})
      // eslint-disable-next-line
    }.bind(this))
    .catch(function(error) {
      console.log(error)
    })

    // fetch("url,
    // { method: 'POST', body: formData })
    // .then(res => res.json()).then(res => (console.log(res.jwt),
    // window.localStorage.setItem('jwt', res.jwt)))
    // .then(() => this.props.history.push('/'))
    // .catch(function(error){console.log('There is an error: ', error.message)})
 //    let url3 = config.url.BASE_URL + "/logged_in"
 //    axios.all([axios.patch(url, {newSport: addThisSport}, {headers: {'Access-Control-Allow-Origin': '*'}}, {withCredentials: true} ), axios.patch(url2, {newUserInSport: addUserToSport}, {headers: {'Access-Control-Allow-Origin': '*'}}, {withCredentials: true})])
 //      .then(axios.spread((...responses) => {
 //        axios.get(url3, {headers: {'Access-Control-Allow-Origin': '*'}}, {withCredentials: true})
 //        .then(response => {
 //          const user = response.data.user
 //
 //        this.setState({
 //          sportMatches: [],
 //          rating: "",
 //          sport: "",
 //          error: "",
 //          changed: bold,
 //          winner: '0',
 //          user
 //        })})
 //        // this.props.history.push('/profile')
 //      }))
    }
  }


  render(){
    let sportsPlayed = []
    let unofficial = "*"
    let official = ""
    let officialOrNot, sOrNot
    let s = "s"
    let athlete = ""
    let sportList = []
    let ratingChange = ""
    let anyUnofficial = false
    let anyUnplayed = false
    let anyOfficial = false
    let officialSportPlayed = []
    let officialSportsList = []
    let officialSportColumn = []
    let unofficialSportPlayed = []
    let unofficialSportsList = []
    let unofficialSportColumn = []
    let onlyInitialRating = []
    let onlyInitialSportColumn = []
    let onlyInitialIncluded = false
    let initialCard = ""
    let officialIncluded = false
    let officialCard = ""
    let unofficialIncluded = false
    let unofficialCard = ""
    let athleteIndex = -1



    if((this.state.user.sports && this.state.user.sports.length > 0) || (this.state.bonusSports && this.state.bonusSports.length > 0)){
      // Get list of sports sorted
      let sports = this.sortedSportsList()
      let officialLength = sports.pop()


      sports.forEach((sport, i) => {
        let color = 'black'
        let weight = 'normal'
        let fontSize = 'inherit'
        let variant = 'light'
        if(sport){
          // eslint-disable-next-line
          if(sport.id == this.state.changed){
            weight = 'bold'
            fontSize = 'x-large'
            if(this.state.winner === '1'){
              color = 'green'
              ratingChange = `+(${this.state.ratingChange})`
              variant="#C3E6CB"
            } else if (this.state.winner === '2') {
              color = 'red'
              ratingChange = `(-${this.state.ratingChange})`
              variant="#F5C6CB"
            } else {
              color = 'blue'
              variant="primary"
            }
          } else {
            ratingChange = ""
            variant="light"
          }
          if(i === 0){
            sportsPlayed.push("")
          }
          if(sport === ""){
            sportsPlayed.push(<br key={`skip${i}`}/>)
          } else {
            if ((sport.id === "10" && sport.official === true) || (sport.id !== "10" && i <= officialLength)){

              officialOrNot = official
              fontSize="3vh"
              if(sport.id !== "10"){
                if(anyOfficial === false){
                  anyOfficial = true
                  sportsPlayed.push(<span style={{fontSize: "3.2vh", color: "#435685"}} key="official"><br/><br/><b>Official Sports</b><br/><div style={{height: "1vh"}}></div></span>)
              }
                officialIncluded = true
                officialSportsList.push(sport)
                officialSportPlayed.push(
                    <tr style={{backgroundColor: variant}} className="profile-sport-list-item">
                      <td style={{cursor: 'default'}} className="group sport-name">{sport.name}</td>

                      <td className="group rating">{`${sport.rating.toFixed(2)}`} {ratingChange}</td>
                      <td className="group opponents-played">{sport.opponents.length}</td>
                      <td className="group games-played">{sport.numGames}</td>


                    </tr>
                )
                sportsPlayed.push(
                  <div
                  className="officialSportsPlayedListItem"
                  data-sportid={sport.id}
                  key={`sport${sport.id}`}
                  sport={sport.name}
                  style={{fontWeight: 'bold', color: "#435685", fontSize}}>
                  {sport.name}: {`${sport.rating.toFixed(2)}`} {ratingChange}
                  </div>
                )

              }
            } else {
              if(sport.id !== "10"){
                officialOrNot = unofficial
                if (sport.opponents.length > 1){
                  sOrNot = s
                } else {
                  sOrNot = official
                }
                let games
                if(!sport.numGames){
                  games = 0
                } else {
                  games = sport.numGames
                }
                if(games > 0){
                  unofficialIncluded = true
                  unofficialSportsList.push(sport)
                    unofficialSportPlayed.push(
                        <tr style={{backgroundColor: variant}} className="profile-sport-list-item">
                        <td style={{cursor: 'default'}} className="group sport-name">{sport.name}</td>

                          <td className="group rating">{`${sport.rating.toFixed(2)}`} {ratingChange}</td>
                          <td className="group opponents-played">{sport.opponents.length}</td>
                          <td className="group games-played">{sport.numGames}</td>

                        </tr>
                    )
                  }
                 else {
                  onlyInitialIncluded = true

                    onlyInitialRating.push(
                        <tr style={{backgroundColor: variant}} className="profile-sport-list-item">
                        <td style={{cursor: 'default'}} className="group sport-name">{sport.name}</td>

                          <td className="group rating">{`${sport.rating.toFixed(2)}`}</td>
                        </tr>
                    )
                  }
                //   onlyInitialRating.push(
                //     <ListGroup.Item action className="profile-sport-list-item" variant={variant}>
                //       <Row >
                //       <Col className="group sport-and-rating">{sport.name}: {`${sport.rating.toFixed(2)}`} {ratingChange}</Col>
                //       </Row>
                //     </ListGroup.Item>
                //   )
                // }
                let text = <div><span>{sport.name}: {sport.rating.toFixed(2)}{officialOrNot} {ratingChange}</span><span style={{float: 'right'}}>{sport.opponents.length} opponent{sOrNot} played</span></div>
                if(sport.opponents.length > 0){
                  if(!anyUnofficial){
                    anyUnofficial = true
                    sportsPlayed.push(<span style={{fontSize: "3vh"}} key="unofficial"><br/><br/><b>Unofficial Sports</b><br/> <span style={{fontSize: "large"}}>Play 5 or more opponents to earn an official rating</span>  <br/><br/></span>)
                  }

                } else {
                  if(!anyUnplayed){
                    anyUnplayed = true
                    sportsPlayed.push(<div><br/><span style={{fontSize: "3vh"}} key="initial"><br/><b>Initial Rating Only</b></span><br/><br/></div>)
                    sOrNot = s
                  }
                  text = <div>{sport.name}: {sport.rating.toFixed(2)}{officialOrNot} {ratingChange}</div>
                }

                sportsPlayed.push(
                  <div
                  className="sportsPlayedListItem"
                  data-sportid={sport.id}
                  key={`sport${sport.id}`}
                  style={{color, fontWeight: weight, fontSize: 'x-large'}}
                  sport={sport.name}>
                  {text}
                  </div>
              )
              }
            }

            if(sport.id === "10"){
              athleteIndex = i

            }}
        }});
        //place here
        let firstSport = ""
        let secondSport = ""
        let secondSportB = ""
        let thirdSport = ""
        let thirdSportB = ""
        let fourthSport = ""
        let fourthSportB = ""
        let fifthSport = ""
        let fifthSportB = ""
        let sportsList = []
        let maxRating = [0,1]
        let aColor = "inherit"
        let bColor = "inherit"
        let aTextColor = "inherit"
        let bTextColor = "inherit"
        let defaultKey="a1"
        if(athleteIndex >= 0){
          let official = 'unofficial. In order to make it official you must have at least one official sport.'
          if (sports[athleteIndex].official){
            official='official'
            sportsList = officialSportsList
          } else{
              official='unofficial'
              sportsList = unofficialSportsList
            }
            firstSport = <span>{sportsList[0].name}: {sportsList[0].rating}</span>
            if (sportsList.length > 1){
              if (sportsList.length === 2){
                if((sportsList[1].rating * 0.5 + sportsList[0].rating * 0.55) >= (sportsList[1].rating * 0.01 + sportsList[0].rating)){
                  aColor="green"
                  aTextColor="white"
                  defaultKey = "a2"
                } else {
                  bColor = "green"
                  bTextColor="white"
                  defaultKey = "b2"
                }
              }
              secondSport =
              <Table style={{textAlign: "center"}}>
                <thead>
                  <tr>
                    <th className="align-middle">Sport Name</th>
                    <th className="align-middle">Rating</th>
                    <th className="align-middle">Portion of Athlete Rating</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="align-middle">{sportsList[0].name}</td>
                    <td className="align-middle">{sportsList[0].rating.toFixed(2)} * 0.55</td>
                    <td className="align-middle">{(sportsList[0].rating * 0.55).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[1].name}</td>
                    <td className="align-middle">{sportsList[1].rating.toFixed(2)} * 0.50 </td>
                    <td className="align-middle">{(sportsList[1].rating * 0.5).toFixed(2)}</td>
                  </tr>
                  <tr style={{fontWeight: "bold"}}>
                    <td className="align-middle">Total</td>
                    <td className="align-middle">{(sportsList[0].rating * 0.55).toFixed(2)} + {(sportsList[1].rating*0.5).toFixed(2)}</td>
                    <td style={{backgroundColor: aColor, color: aTextColor}}>{(sportsList[1].rating * 0.5 + sportsList[0].rating * 0.55).toFixed(2)}</td>
                  </tr>
                </tbody>
              </Table>
              maxRating[0] = (sportsList[1].rating * 0.5 + sportsList[0].rating * 0.55)
              secondSportB =
              <Table style={{textAlign: "center"}}>
                <thead>
                  <tr>
                    <th className="align-middle">Sport Name</th>
                    <th className="align-middle">Rating</th>
                    <th className="align-middle">Portion of Athlete Rating</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="align-middle">{sportsList[0].name}</td>
                    <td className="align-middle">{sportsList[0].rating.toFixed(2)}</td>
                    <td className="align-middle">{(sportsList[0].rating).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[1].name}</td>
                    <td className="align-middle">{sportsList[1].rating.toFixed(2)} * 0.01 </td>
                    <td className="align-middle">{(sportsList[1].rating * 0.01).toFixed(2)}</td>
                  </tr>
                  <tr style={{fontWeight: "bold"}}>
                    <td className="align-middle">Total</td>
                    <td className="align-middle">{(sportsList[0].rating).toFixed(2)} + {(sportsList[1].rating*0.01).toFixed(2)}</td>
                    <td style={{backgroundColor: bColor, color: bTextColor}}>{(sportsList[1].rating * 0.01 + sportsList[0].rating).toFixed(2)}</td>
                  </tr>
                </tbody>
              </Table>
              if((sportsList[1].rating * 0.01 + sportsList[0].rating) > maxRating[0]){
                maxRating = [sportsList[1].rating * 0.01 + sportsList[0].rating, 2]
              }
            } else {
              secondSport = `You must have another ${official} sport to see this breakdown.`
              secondSportB = `You must have another ${official} sport to see this breakdown.`
            }
            if (sportsList.length > 2){
              if (sportsList.length === 3){
                if((sportsList[1].rating / 3 +
                  sportsList[2].rating / 3
                  + sportsList[0].rating / 3
                  + sportsList[0].rating / 10) >
                  (maxRating[0] + sportsList[2].rating * 0.01)){
                  aColor="green"
                  aTextColor="white"
                  defaultKey = "a3"
                } else {
                  bColor = "green"
                  bTextColor="white"
                  defaultKey = "b3"
                }
              }
              thirdSport =
              <Table style={{textAlign: "center"}}>
                <thead>
                  <tr>
                    <th className="align-middle">Sport Name</th>
                    <th className="align-middle">Rating</th>
                    <th className="align-middle">Portion of Athlete Rating</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="align-middle">{sportsList[0].name}</td>
                    <td className="align-middle">{sportsList[0].rating.toFixed(2)} * 0.43</td>
                    <td className="align-middle">{(sportsList[0].rating / 3 + sportsList[0].rating / 10).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[1].name}</td>
                    <td className="align-middle">{sportsList[1].rating.toFixed(2)} * 0.33 </td>
                    <td className="align-middle">{(sportsList[1].rating / 3).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[2].name}</td>
                    <td className="align-middle">{sportsList[2].rating.toFixed(2)} * 0.33 </td>
                    <td className="align-middle">{(sportsList[2].rating / 3).toFixed(2)}</td>
                  </tr>
                  <tr style={{fontWeight: "bold"}}>
                    <td className="align-middle">Total</td>
                    <td className="align-middle">{(sportsList[0].rating / 3 +
                      sportsList[0].rating / 10).toFixed(2)} +
                      {(sportsList[1].rating / 3).toFixed(2)} +
                      {(sportsList[2].rating / 3).toFixed(2)}</td>
                    <td style={{backgroundColor: aColor, color: aTextColor}}>{(sportsList[1].rating / 3 +
                      sportsList[2].rating / 3
                      + sportsList[0].rating / 3
                      + sportsList[0].rating / 10).toFixed(2)}</td>
                  </tr>
                </tbody>
              </Table>
              thirdSportB =
              <Table style={{textAlign: "center"}}>
                <thead>
                  <tr>
                    <th className="align-middle">Sport Name</th>
                    <th className="align-middle">Rating</th>
                    <th className="align-middle">Portion of Athlete Rating</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="align-middle">Top 2 Sports</td>
                    <td className="align-middle">{maxRating[0].toFixed(2)}</td>
                    <td className="align-middle">{maxRating[0].toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[2].name}</td>
                    <td className="align-middle">{sportsList[2].rating.toFixed(2)} * 0.01 </td>
                    <td className="align-middle">{(sportsList[2].rating * 0.01).toFixed(2)}</td>
                  </tr>
                  <tr style={{fontWeight: "bold"}}>
                    <td className="align-middle">Total</td>
                    <td className="align-middle">{(maxRating[0]).toFixed(2)} + {(sportsList[2].rating*0.01).toFixed(2)}</td>
                    <td  className="align-middle" style={{backgroundColor: bColor, color: bTextColor}}>{(sportsList[2].rating * 0.01 + maxRating[0]).toFixed(2)}</td>
                  </tr>
                </tbody>
              </Table>
              maxRating = Math.max(sportsList[1].rating / 3 +
                sportsList[2].rating / 3
                + sportsList[0].rating / 3
                + sportsList[0].rating / 10,
                (maxRating[0] + sportsList[2].rating * 0.01))
            } else {
              thirdSport = `You must have another ${3 - sportsList.length} ${official} sport(s) to see this breakdown.`
              thirdSportB = `You must have another ${3 - sportsList.length} ${official} sport(s) to see this breakdown.`
            }
            if (sportsList.length > 3){
              if (sportsList.length === 4){
                if((sportsList[1].rating / 4 +
                  sportsList[2].rating / 4
                  + sportsList[0].rating * 0.40
                  + sportsList[3].rating / 4) >
                  (maxRating[0] + sportsList[3].rating * 0.01)){
                  aColor="green"
                  aTextColor="white"
                  defaultKey = "a4"
                } else {
                  bColor = "green"
                  bTextColor="white"
                  defaultKey = "b4"
                }
              }
              fourthSport =
              <Table style={{textAlign: "center"}}>
                <thead>
                  <tr>
                    <th className="align-middle">Sport Name</th>
                    <th className="align-middle">Rating</th>
                    <th className="align-middle">Portion of Athlete Rating</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="align-middle">{sportsList[0].name}</td>
                    <td className="align-middle">{sportsList[0].rating.toFixed(2)} * 0.40</td>
                    <td className="align-middle">{(sportsList[0].rating * 0.4).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[1].name}</td>
                    <td className="align-middle">{sportsList[1].rating.toFixed(2)} * 0.25 </td>
                    <td className="align-middle">{(sportsList[1].rating / 4).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[2].name}</td>
                    <td className="align-middle">{sportsList[2].rating.toFixed(2)} * 0.25 </td>
                    <td className="align-middle">{(sportsList[2].rating / 4).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[3].name}</td>
                    <td className="align-middle">{sportsList[3].rating.toFixed(2)} * 0.25 </td>
                    <td className="align-middle">{(sportsList[3].rating / 4).toFixed(2)}</td>
                  </tr>
                  <tr style={{fontWeight: "bold"}}>
                    <td className="align-middle">Total</td>
                    <td className="align-middle">{(sportsList[0].rating * 0.4).toFixed(2)} +
                      {(sportsList[1].rating / 4).toFixed(2)} +
                      {(sportsList[2].rating / 4).toFixed(2)} +
                      {(sportsList[3].rating / 4).toFixed(2)} </td>
                    <td className="align-middle">{(sportsList[1].rating / 4 +
                      sportsList[2].rating / 4 +
                      sportsList[3].rating / 4
                      + sportsList[0].rating * 0.4).toFixed(2)}</td>
                  </tr>
                </tbody>
              </Table>
              fourthSportB =
              <Table style={{textAlign: "center"}}>
                <thead>
                  <tr>
                    <th className="align-middle">Sport Name</th>
                    <th className="align-middle">Rating</th>
                    <th className="align-middle">Portion of Athlete Rating</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="align-middle">Top 3 Sports</td>
                    <td className="align-middle">{maxRating.toFixed(2)}</td>
                    <td className="align-middle">{maxRating.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[3].name}</td>
                    <td className="align-middle">{sportsList[3].rating.toFixed(2)} * 0.01 </td>
                    <td className="align-middle">{(sportsList[3].rating * 0.01).toFixed(2)}</td>
                  </tr>
                  <tr style={{fontWeight: "bold"}}>
                    <td className="align-middle">Total</td>
                    <td className="align-middle">{maxRating.toFixed(2)} + {(sportsList[3].rating*0.01).toFixed(2)}</td>
                    <td className="align-middle">{(sportsList[3].rating * 0.01 + maxRating).toFixed(2)}</td>
                  </tr>
                </tbody>
              </Table>
              maxRating = Math.max(sportsList[1].rating / 4 +
                sportsList[2].rating / 4
                + sportsList[0].rating * 0.4
                + sportsList[3].rating / 4,
                (maxRating + sportsList[3].rating * 0.01))
            } else {
              fourthSport = `You must have another ${4 - sportsList.length} ${official} sport(s) to see this breakdown.`
              fourthSportB = `You must have another ${4 - sportsList.length} ${official} sport(s) to see this breakdown.`
            }
            if (officialSportsList.length > 4){
                if (sportsList.length === 5){
                  if((sportsList[1].rating / 5 +
                    sportsList[2].rating / 5
                    + sportsList[0].rating * 0.40
                    + sportsList[3].rating / 5
                    + sportsList[4].rating / 5) >
                    (maxRating[0] + sportsList[4].rating * 0.01)){
                    aColor="green"
                    aTextColor="white"
                    defaultKey = "a5"
                  } else {
                    bColor = "green"
                    bTextColor="white"
                    defaultKey = "b5"
                  }
                }
              fifthSport =
              <Table style={{textAlign: "center"}}>
                <thead>
                  <tr>
                    <th className="align-middle">Sport Name</th>
                    <th className="align-middle">Rating</th>
                    <th className="align-middle">Portion of Athlete Rating</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="align-middle">{sportsList[0].name}</td>
                    <td className="align-middle">{sportsList[0].rating.toFixed(2)} * 0.40</td>
                    <td className="align-middle">{(sportsList[0].rating * 0.4).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[1].name}</td>
                    <td className="align-middle">{sportsList[1].rating.toFixed(2)} * 0.20 </td>
                    <td className="align-middle">{(sportsList[1].rating / 5).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[2].name}</td>
                    <td className="align-middle">{sportsList[2].rating.toFixed(2)} * 0.20 </td>
                    <td className="align-middle">{(sportsList[2].rating / 5).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[3].name}</td>
                    <td className="align-middle">{sportsList[3].rating.toFixed(2)} * 0.20 </td>
                    <td className="align-middle">{(sportsList[3].rating / 5).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[4].name}</td>
                    <td className="align-middle">{sportsList[4].rating.toFixed(2)} * 0.20 </td>
                    <td className="align-middle">{(sportsList[4].rating / 5).toFixed(2)}</td>
                  </tr>
                  <tr style={{fontWeight: "bold"}}>
                    <td className="align-middle">Total</td>
                    <td className="align-middle">{(sportsList[0].rating * 0.4).toFixed(2)} +
                      {(sportsList[1].rating / 5).toFixed(2)} +
                      {(sportsList[2].rating / 5).toFixed(2)} +
                      {(sportsList[3].rating / 5).toFixed(2)} +
                      {(sportsList[4].rating / 5).toFixed(2)}</td>
                    <td className="align-middle">{(sportsList[1].rating / 5 +
                      sportsList[2].rating / 5 +
                      sportsList[3].rating / 5 +
                      sportsList[4].rating / 5
                      + sportsList[0].rating * 0.4).toFixed(2)}</td>
                  </tr>
                </tbody>
              </Table>
              fifthSportB =
              <Table style={{textAlign: "center"}}>
                <thead>
                  <tr>
                    <th className="align-middle">Sport Name</th>
                    <th className="align-middle">Rating</th>
                    <th className="align-middle">Portion of Athlete Rating</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="align-middle">Top 4 Sports</td>
                    <td className="align-middle">{maxRating.toFixed(2)}</td>
                    <td className="align-middle">{maxRating.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="align-middle">{sportsList[4].name}</td>
                    <td className="align-middle">{sportsList[4].rating.toFixed(2)} * 0.01 </td>
                    <td className="align-middle">{(sportsList[4].rating * 0.01).toFixed(2)}</td>
                  </tr>
                  <tr style={{fontWeight: "bold"}}>
                    <td className="align-middle">Total</td>
                    <td className="align-middle">{maxRating.toFixed(2)} + {(sportsList[4].rating*0.01).toFixed(2)}</td>
                    <td className="align-middle">{(sportsList[4].rating * 0.01 + maxRating).toFixed(2)}</td>
                  </tr>
                </tbody>
              </Table>
            } else {
              fifthSport = `You must have another ${5 - sportsList.length} ${official} sport(s) to see this breakdown.`
              fifthSportB = `You must have another ${5 - sportsList.length} ${official} sport(s) to see this breakdown.`
            }

          athlete =       <Accordion flush >
                            <Accordion.Item eventKey="0">
                              <Row><Accordion.Header className="athlete-Accordion" key={sports[athleteIndex].id}><b><OverlayTrigger
  key="athlete-tooltip"
  placement='top'
  delay={{hide: 300}}
  overlay={
    <Tooltip size="lg" id={`tooltip-athlete`}>
      Click to Learn More
    </Tooltip>
  }
><span className="athlete-statement"><span className="pr-2 athlete-statement-words" style={{color: "#225FBA"}}>Athlete Rating</span> {sports[athleteIndex].rating.toFixed(2)}</span>
</OverlayTrigger></b></Accordion.Header><span></span></Row>
                              <Accordion.Body>
                                <h4 className="text-center">Your athlete rating is <b>{official}</b>. It is calculated as the highest of the following.</h4>
                                <Table striped bordered className="text-center d-none d-md-block">
                                <thead>
                                  <tr>
                                    <th><OverlayTrigger
                                            placement="top"
                                            key="top"
                                            overlay={
                                              <Tooltip id={`tooltip-top`}>
                                                Number of {official} sports.
                                              </Tooltip>
                                            }
                                            ><u style={{borderBottom: "1px dotted #000", textDecoration: "none"}}>#</u></OverlayTrigger></th>
                                    <th></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="align-middle">1</td>
                                    <td colSpan="2"><b>100% of your top sport's rating.</b></td>
                                  </tr>
                                  <tr>
                                    <td className="align-middle">2</td>
                                    <td><div className="mb-3">
                                      <Accordion defaultActiveKey={defaultKey} className="breakdown">
                                        <Accordion.Item eventKey="a2">
                                          <Accordion.Header className="even"><span className="breakdown">55% of your top sport's rating + 50% of the other.</span></Accordion.Header>
                                            <Accordion.Body>
                                              {secondSport}
                                            </Accordion.Body>
  </Accordion.Item></Accordion></div></td>
                                    <td><div className="mb-3">
                                      <Accordion defaultActiveKey={defaultKey} className="breakdown">
                                        <Accordion.Item eventKey="b2">
                                          <Accordion.Header className="even"><span className="breakdown">100% of your top sport's rating + 1% of your 2nd highest.</span></Accordion.Header>
                                            <Accordion.Body>
                                              {secondSportB}
                                            </Accordion.Body>
  </Accordion.Item></Accordion></div></td>
                                  </tr>
                                  <tr>
                                    <td className="align-middle">3</td>
                                    <td><div className="mb-3"><Accordion defaultActiveKey={defaultKey} className="breakdown">
                                      <Accordion.Item eventKey="a3">
                                        <Accordion.Header className="odd"><span className="breakdown">43% of your top sport's rating + 33% of the other 2.</span></Accordion.Header>
                                          <Accordion.Body>
                                            {thirdSport}
                                          </Accordion.Body>
</Accordion.Item></Accordion></div></td>
                                    <td><div className="mb-3"><Accordion defaultActiveKey={defaultKey} className="breakdown">
                                      <Accordion.Item eventKey="b3">
                                        <Accordion.Header className="odd"><span className="breakdown">The highest rating for 2 sports + 1% of 3rd highest sport's rating.</span></Accordion.Header>
                                          <Accordion.Body>
                                            {thirdSportB}
                                          </Accordion.Body>
</Accordion.Item></Accordion></div></td>
                                  </tr>
                                  <tr>
                                    <td className="align-middle">4</td>
                                    <td><div className="mb-3"><Accordion className="breakdown">
                                      <Accordion.Item eventKey="a4">
                                        <Accordion.Header className="even"><span className="breakdown">40% of your top sport's rating + 25% of the other 3.</span></Accordion.Header>
                                          <Accordion.Body>
                                            {fourthSport}
                                          </Accordion.Body>
</Accordion.Item></Accordion></div></td>
<td><div className="mb-3"><Accordion className="breakdown">
  <Accordion.Item eventKey="b4">
    <Accordion.Header className="even"><span className="breakdown">The highest rating for 3 sports + 1% of 4th highest sport's rating.
</span></Accordion.Header>
      <Accordion.Body>
        {fourthSportB}
      </Accordion.Body>
</Accordion.Item></Accordion></div></td>
                                  </tr>
                                <tr>
                                  <td className="align-middle">5</td>
                                  <td><div className="mb-3"><Accordion className="breakdown">
                                    <Accordion.Item eventKey="a5">
                                      <Accordion.Header className="odd"><span className="breakdown">40% of your top sport's rating + 20% of the other 4.</span></Accordion.Header>
                                        <Accordion.Body>
                                          {fifthSport}
                                        </Accordion.Body>
</Accordion.Item></Accordion></div></td>
<td><div className="mb-3"><Accordion className="breakdown">
  <Accordion.Item eventKey="b5">
    <Accordion.Header className="odd"><span className="breakdown">The highest rating for 4 sports + 1% of 5th highest sport's rating.</span></Accordion.Header>
      <Accordion.Body>
        {fifthSportB}
      </Accordion.Body>
</Accordion.Item></Accordion></div></td>
                                </tr>
                              </tbody>

                              </Table>
                              <Table bordered className="text-center d-block d-md-none">
                              <thead>
                                <tr>
                                  <th><OverlayTrigger
                                          placement="top"
                                          key="top"
                                          overlay={
                                            <Tooltip id={`tooltip-top`}>
                                              Number of {official} sports.
                                            </Tooltip>
                                          }
                                          ><u style={{borderBottom: "1px dotted #000", textDecoration: "none"}}>#</u></OverlayTrigger></th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="align-middle">1</td>
                                  <td><b>100% of your top sport's rating.</b></td>
                                </tr>
                                <tr>
                                  <td rowSpan="2" className="align-middle">2</td>
                                  <td><div className="mb-3">
                                    <Accordion defaultActiveKey={defaultKey} className="breakdown">
                                      <Accordion.Item eventKey="a2">
                                        <Accordion.Header className="even"><span className="breakdown">55% of your top sport's rating + 50% of the other.</span></Accordion.Header>
                                          <Accordion.Body>
                                            {secondSport}
                                          </Accordion.Body>
</Accordion.Item></Accordion></div></td>
                                </tr>
                                <tr>
                                  <td><div className="mb-3">
                                    <Accordion defaultActiveKey={defaultKey} className="breakdown">
                                      <Accordion.Item eventKey="b2">
                                        <Accordion.Header className="even"><span className="breakdown">100% of your top sport's rating + 1% of your 2nd highest.</span></Accordion.Header>
                                          <Accordion.Body>
                                            {secondSportB}
                                          </Accordion.Body>
</Accordion.Item></Accordion></div></td>
                                </tr>
                                <tr>
                                  <td rowSpan="2" className="align-middle">3</td>
                                  <td><div className="mb-3"><Accordion defaultActiveKey={defaultKey} className="breakdown">
                                    <Accordion.Item eventKey="a3">
                                      <Accordion.Header className="odd"><span className="breakdown">43% of your top sport's rating + 33% of the other 2.</span></Accordion.Header>
                                        <Accordion.Body>
                                          {thirdSport}
                                        </Accordion.Body>
</Accordion.Item></Accordion></div></td></tr>
                                  <tr><td><div className="mb-3"><Accordion defaultActiveKey={defaultKey} className="breakdown">
                                    <Accordion.Item eventKey="b3">
                                      <Accordion.Header className="odd"><span className="breakdown">The highest rating for 2 sports + 1% of 3rd highest sport's rating.</span></Accordion.Header>
                                        <Accordion.Body>
                                          {thirdSportB}
                                        </Accordion.Body>
</Accordion.Item></Accordion></div></td>
                                </tr>
                                <tr>
                                  <td rowSpan="2" className="align-middle">4</td>
                                  <td><div className="mb-3"><Accordion className="breakdown">
                                    <Accordion.Item eventKey="a4">
                                      <Accordion.Header className="even"><span className="breakdown">40% of your top sport's rating + 25% of the other 3.</span></Accordion.Header>
                                        <Accordion.Body>
                                          {fourthSport}
                                        </Accordion.Body>
</Accordion.Item></Accordion></div></td></tr>
<tr><td><div className="mb-3"><Accordion className="breakdown">
<Accordion.Item eventKey="b4">
  <Accordion.Header className="even"><span className="breakdown">The highest rating for 3 sports + 1% of 4th highest sport's rating.
</span></Accordion.Header>
    <Accordion.Body>
      {fourthSportB}
    </Accordion.Body>
</Accordion.Item></Accordion></div></td>
                                </tr>
                              <tr>
                                <td rowSpan="2" className="align-middle">5</td>
                                <td><div className="mb-3"><Accordion className="breakdown">
                                  <Accordion.Item eventKey="a5">
                                    <Accordion.Header className="odd"><span className="breakdown">40% of your top sport's rating + 20% of the other 4.</span></Accordion.Header>
                                      <Accordion.Body>
                                        {fifthSport}
                                      </Accordion.Body>
</Accordion.Item></Accordion></div></td></tr>
<tr><td><div className="mb-3"><Accordion className="breakdown">
<Accordion.Item eventKey="b5">
  <Accordion.Header className="odd"><span className="breakdown">The highest rating for 4 sports + 1% of 5th highest sport's rating.</span></Accordion.Header>
    <Accordion.Body>
      {fifthSportB}
    </Accordion.Body>
</Accordion.Item></Accordion></div></td>
                              </tr>
                            </tbody>

                            </Table>

                              </Accordion.Body>
                            </Accordion.Item>
                          </Accordion>

        }
    }

    this.state.sportMatches.forEach((sport) => {
      sportList.push(<ListGroup.Item className="sportsListItem" action id={sport.id} key={`sport${sport.id}`} name={sport.name}>{sport.name}</ListGroup.Item>)
    });

    if (onlyInitialIncluded){
      initialCard =
        <Card className="mt-5 initial-card shadow" style={{width: '100%'}}>
        <Card.Body>
          <Card.Title className="initial-title ml-5">Initial Rating Only</Card.Title>
          <Container className="mx-auto w-100">
            <Row>

            <Col className="px-0 mx-0 w-100" xs="12">
            <Table className="pl-0 mx-0" striped hover responsive="sm">
              <thead>
                <tr>
                  <th/>
                  <th style={{cursor: 'default'}}>Rating</th>
                </tr>
              </thead>
              <tbody>
              {onlyInitialRating}
            </tbody>
            </Table>
            </Col>
            </Row>
            <Row>
            </Row>
            </Container>
          </Card.Body>
        </Card>
    }
    if(unofficialIncluded){
      unofficialCard =

        <Card className="mt-5 unofficial-card shadow" style={{width: '100%'}}>
        <Card.Body>
          <Card.Title className="unofficial-title ml-5">Unofficial Sports <span>
          <OverlayTrigger
     trigger={["hover", "focus"]}
     placement="auto"
     overlay={
       <Popover style={{width: '120%'}}>
         <Popover.Header as="h3" style={{textAlign: "center"}}>Unofficial Sports*</Popover.Header>
         <Popover.Body>
         Sports are unofficial until you have played at least five opponents <b>AND</b> at least five games.
         </Popover.Body>
       </Popover>
     }
   >
     <Button className="unofficial-explanation pb-2">?</Button>
   </OverlayTrigger>
    </span></Card.Title>
    <Container className="mx-auto">
      <Row>
      <Col className="pl-0 ml-0" xs="12">
      <Table className="pl-0 ml-0" striped hover responsive="sm">
        <thead>
          <tr>
            <th/>
            <th style={{cursor: 'default'}}>Rating</th>
            <OverlayTrigger
                    placement="top"
                    key="top"
                    overlay={
                      <Tooltip id={`tooltip-top`}>
                        Opponents Played
                      </Tooltip>
                    }
                    ><th style={{cursor: 'default'}}><u style={{borderBottom: "1px dotted #000", textDecoration: "none"}}>OP</u></th></OverlayTrigger>
                    <OverlayTrigger
                            placement="top"
                            key="top"
                            overlay={
                              <Tooltip id={`tooltip-top`}>
                                Game Played
                              </Tooltip>
                            }
                            ><th style={{cursor: 'default'}}><u style={{borderBottom: "1px dotted #000", textDecoration: "none"}}>GP</u></th></OverlayTrigger>
          </tr>
        </thead>
        <tbody>
        {unofficialSportPlayed}
      </tbody>
      </Table>
      </Col>
      </Row>
      <Row>
        <a href="#add-sport">Add a New Sport</a>
      </Row>
      </Container>
          </Card.Body>
        </Card>
    }
    if(officialIncluded){
      officialCard =
        <Card className="mt-5 official-card shadow w-100" >
        <Card.Body>
          <Card.Title style={{textAlign: "left"}} className="official-title ml-5">Ranked Sports</Card.Title>
          <Container className="mx-auto">
            <Row>
            <Col className="pl-0 mx-0" xs="12">
            <Table className="pl-0 ml-0" striped hover responsive="sm">
              <thead>
                <tr>
                  <th/>
                  <th style={{cursor: 'default'}}>Rating</th>
                  <OverlayTrigger
                          placement="top"
                          key="top"
                          overlay={
                            <Tooltip id={`tooltip-top`}>
                              Opponents Played
                            </Tooltip>
                          }
                          ><th style={{cursor: 'default'}}><u style={{borderBottom: "1px dotted #000", textDecoration: "none"}}>OP</u></th></OverlayTrigger>
                          <OverlayTrigger
                                  placement="top"
                                  key="top"
                                  overlay={
                                    <Tooltip id={`tooltip-top`}>
                                      Game Played
                                    </Tooltip>
                                  }
                                  ><th style={{cursor: 'default'}}><u style={{borderBottom: "1px dotted #000", textDecoration: "none"}}>GP</u></th></OverlayTrigger>
                </tr>
              </thead>
              <tbody>
              {officialSportPlayed}
            </tbody>
            </Table>
            </Col>
            </Row>
            <Row>
              <a href="#add-sport">Add a New Sport</a>
            </Row>
            </Container>
          </Card.Body>
        </Card>
    }
    return(

      <div style={{paddingTop: "3%", paddingBottom: "1%", backgroundColor: "#eee"}}>
      <Container className="d-block d-lg-none pb-5">
        <Row>
          <Col>
          .
          </Col>
        </Row>
      </Container>

          <Container className="ml-0" style={{paddingTop: "5%", paddingBottom: "1%", backgroundColor: "#eee"}}>
          <Row style={{width: '100vw'}}>
          <Col xs="12" md="9" className="px-0 mx-md-auto">
          <Card className="ml-0" style={{width: "100%"}} className="shadow">
            <Card.Title className="athlete-card-title pt-3 pl-5" style={{fontSize: '4vh'}}><b>{this.state.user.firstname} {this.state.user.lastname}'s <br className="d-block d-md-none"/>Athlete Profile</b><br/><span style={{fontSize: "3vh"}}>@{this.state.user.username}</span></Card.Title>
            <Card.Body className="pl-5">
              <span style={{marginBottom: "1%"}}>{athlete}</span>
            </Card.Body>
          </Card>
            </Col>
          </Row>
          <Row style={{width: '100vw'}}>
            <Col xs="12" md="9" className="px-0 mx-md-auto">
          {officialCard}
            </Col>
          </Row>
          <Row style={{width: '100vw'}}>
            <Col xs="12" md="9" className="px-0 mx-md-auto">
              {unofficialCard}
            </Col>
          </Row>
          <Row style={{width: '100vw'}}>
            <Col xs="12" md="9" className="px-0 mx-md-auto">
              {initialCard}
            </Col>
          </Row>
          <Row style={{width: '100vw'}}>
          <Col xs="12" md="9" className="px-0 mx-md-auto">
          <Card style={{width: '100%'}} id="add-sport" className="mt-5 add-sport shadow">
            <Card.Body>
              <Card.Title className="add-sport-title ml-md-5 mb-4">Pick a sport that you want to play and set your initial rating out of 10</Card.Title>
              <Form onSubmit={this.handleSubmit}>
              <Row>
                <Col xs="12" className="ml-md-5" lg="auto">
                  <Form.Control
                    size="lg"
                    className="mb-2"
                    name="sport"
                    placeholder="  Sport Name"
                    onChange = {this.handleChange}
                    value={this.state.sport}
                    required
                  />
                </Col>
                <Col xs="12" className="d-block d-lg-none">
                  <ListGroup flush className="sportSearchList d-block d-lg-none" onClick={this.fillSportName}
                >{sportList}</ListGroup>
                </Col>
                <Col xs="12" lg="auto">
                  <Form.Control
                    size="lg"
                    className="mb-2"
                    placeholder="  Rating out of 10"
                    type="number"
                    name="rating"
                    value={this.state.rating}
                    onChange = {this.handleChange}
                    min="1.0"
                    max="10.00000000000"
                    step="0.1"
                    required
                  />
                </Col>
                <Col lg="auto">
                  <Button type="submit" size="lg" variant="success"  className="w-100 mb-2 px-3">
                    Add Rating
                  </Button>
                </Col>
                </Row>
              </Form>
              <Row>
              <Col className="mt-3 ml-5">
              <ListGroup flush className="sportSearchList d-none d-lg-block" onClick={this.fillSportName}
              >{sportList}</ListGroup>
              </Col>
              </Row>
              <Col className="my-3 ml-5">
              <h4 style={{color: "red"}}>{this.state.error}</h4>
              </Col>
            </Card.Body>
          </Card>
          </Col>
          </Row>
          </Container>


      </div>
    )}
}

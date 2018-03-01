import React from 'react'
import { ScrollView, View, Text, TouchableOpacity, Image, TextInput, Button, DatePickerIOS } from 'react-native'
import { Metrics, Images } from './DevTheme'
import FullButton from '../../App/Components/FullButton'
import moment from "moment-timezone"

// For API
import API from '../../App/Services/GatherApi'
import FJSON from 'format-json'

// Styles
import styles from './Styles/APITestingScreenStyles'

export default class APITestingScreen extends React.Component {
  api = {}

  constructor (props) {
    super(props)
    this.initialState = {
      visibleHeight: Metrics.screenHeight,
      datetime: new Date(),
      availableRooms: [],
      availablePackages: []
    }
    this.state = Object.assign({}, this.initialState);

    this.getEndpoints = this.getEndpoints.bind(this);
    this.setDateTime = this.setDateTime.bind(this);
    this.api = API.create()
  }

  showResult (response, title = 'Response') {
    this.refs.container.scrollTo({x: 0, y: 0, animated: true})
    if (response.ok) {
      if (response.data.data.available) this.setState({availableRooms: response.data.data.available})
      if (response.data.data[0]) this.setState({availablePackages: response.data.data})
    } else {
      this.refs.result.setState({message: `${response.problem} - ${response.status}`, title: title})
    }
  }

  // API buttons here:
  getEndpoints () {
    return [
      {
        label: 'Get Available Rooms',
        endpoint: 'getAvailableRooms',
        args: [
          'axuowl7o',
          this.state.date || '2018-05-09',
          this.state.time || '12:00:00',
          this.state.guests || 30
        ]
      },
      {
        label: 'Get Available Packages',
        endpoint: 'getAvailablePackages',
        args: [
          'axuowl7o',
          this.state.room || 'lmef8our',
          this.state.date || '2018-05-09',
          this.state.packageTime || '12:00:00',
          this.state.guests || 30
        ]
      }
    ];
  }

  tryEndpoint (apiEndpoint) {
    const { label, endpoint, args = [''] } = apiEndpoint
    this.api[endpoint].apply(this, args).then((result) => {
      this.showResult(result, label || `${endpoint}(${args.join(', ')})`)
    })
  }

  renderButton (apiEndpoint) {
    const { label, endpoint, args = [''] } = apiEndpoint
    return (
      <FullButton text={label || `${endpoint}(${args.join(', ')})`} onPress={this.tryEndpoint.bind(this, apiEndpoint)} styles={{marginTop: 10}} key={`${endpoint}-${args.join('-')}`} />
    )
  }

  renderRooms (rooms) {
    return rooms.map((room, index) => {
      return <View style={styles.section} key={index}>
        {room.$Photos && room.$Photos[0] && room.$Photos[0].url ? 
          <Image source={{uri: room.$Photos[0].url}} style={{width: 300, height: 200}} />
          : null
        }
        <Text style={{
          color: "#fff",
          fontSize: 20,
          marginTop: 10,
          marginBottom: 10
        }}>{room.name}</Text>
        <Text style={styles.titleText}>{room.description}</Text>
        {this.renderStartTimes(room.startTimes, room.id)}
      </View>
    })
  }

  renderStartTimes (times, roomId) {
    return times.map((time, index) => {
      return <FullButton key={index} text={time.startTime} onPress={() => {
        this.setState({packageTime: time.startTime, room: roomId})
        this.tryEndpoint(this.getEndpoints()[1])
      }}/>
    })
  }

  renderPackages (packages) {
    return packages.map((myPackage, index) => {
      return <View style={styles.section} key={index}>
        {myPackage.photo ? 
          <Image source={{uri: myPackage.photo}} style={{width: 300, height: 200}} />
          : null
        }
        <Text style={styles.titleText}>{myPackage.name}</Text>
        <Text style={styles.titleText}>{myPackage.description}</Text>
        <Text style={styles.titleText}>${myPackage.price}</Text>
      </View>
    })
  }

  setDateTime(newDateTime) {
    let state = {
      datetime: newDateTime,
      date: moment(newDateTime).format("YYYY-MM-DD"),
      time: moment(newDateTime).format("HH:mm:ss"),
    }
    this.setState(state)
  }

  render () {
    return (
      <View style={styles.mainContainer}>
        <TouchableOpacity onPress={() => this.props.navigation.goBack()} style={{
          position: 'absolute',
          paddingTop: 30,
          paddingHorizontal: 5,
          zIndex: 10
        }}>
          <Image source={Images.backButton} />
        </TouchableOpacity>
        { !this.state.availableRooms.length ? 
          <ScrollView style={styles.container} ref='container'>
            <View style={{alignItems: 'center', paddingTop: 60}}>
              <Image source={Images.api} style={styles.logo} />
              <Text style={styles.titleText}>API</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionText}>When would you like to book?</Text>
              <DatePickerIOS
                date={this.state.datetime}
                onDateChange={this.setDateTime}
                minimumDate={new Date()}
                minuteInterval={30}
              />
              <Text style={styles.sectionText}>Guest Count</Text>
              <TextInput
                style={{height: 40, backgroundColor: 'white', borderColor: 'gray', borderWidth: 1}}
                onChangeText={(text) => this.setState({text})}
                value={this.state.guests}
                keyboardType="numeric"
              />
            </View>
            {this.renderButton(this.getEndpoints()[0])}
            <APIResult ref='result' />
          </ScrollView>
        :
          !this.state.availablePackages.length ?
            <ScrollView style={styles.container} ref='container'>
              <View style={{alignItems: 'center', paddingTop: 60}}>
                {this.renderRooms(this.state.availableRooms)}
              </View>
              <FullButton onPress={() => this.setState({availableRooms: []})} text="Back to Search"/>
            </ScrollView>
          :
            <ScrollView style={styles.container} ref='container'>
              <View style={{alignItems: 'center', paddingTop: 60}}>
                {this.renderPackages(this.state.availablePackages)}
              </View>
              <FullButton onPress={() => this.setState({availablePackages: []})} text="Back to Rooms"/>
            </ScrollView>
        }
          
      </View>
    )
  }
}

class APIResult extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      message: false,
      title: false
    }
  }

  onApiPress = () => {
    this.setState({message: false})
  }

  renderView () {
    return (
      <ScrollView style={{ top: 0, bottom: 0, left: 0, right: 0, position: 'absolute' }} overflow='hidden'>
        <TouchableOpacity
          style={{backgroundColor: 'white', padding: 20}}
          onPress={this.onApiPress}
        >
          <Text>{this.state.title} Response:</Text>
          <Text allowFontScaling={false} style={{fontFamily: 'CourierNewPS-BoldMT', fontSize: 10}}>
            {this.state.message}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  render () {
    let messageView = null
    if (this.state.message) {
      return this.renderView()
    }

    return messageView
  }
}

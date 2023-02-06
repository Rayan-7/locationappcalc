import { useState,useEffect} from 'react';
import MapView, { Polyline,Marker } from 'react-native-maps';
import { StyleSheet, View,Alert } from 'react-native';
import Picker from 'react-native-document-picker'
import { DOMParser } from 'xmldom' // for parsing your KLM string, converting it to an XML doc
const converter = require('togeojson') // for parsing your KLM string, converting it to an XML doc
const fs = require('react-native-fs');
import Geolocation from '@react-native-community/geolocation';
import DeviceInfo from 'react-native-device-info';

import {
    Button,
  } from 'react-native';

const MainScreen = ({ route, navigation }) => {
  const [cordinates,setCordinates]= useState()
  
  const [region,setRegion]= useState({
    latitude:32.02798166666666,
    longitude: 34.796063333333336,
    latitudeDelta: 3,
    longitudeDelta: 4
  })
 
  const [position, setPosition] = useState({
    latitude:32.02798166666666,
    longitude: 34.796063333333336,
    latitudeDelta: 0.05,
    longitudeDelta: 0.06
  })

  useEffect(() => {
    if(typeof cordinates !== 'undefined'){
      setRegion({latitude:cordinates[0][0].latitude,
        longitude: cordinates[0][0].longitude,latitudeDelta: 0.05,
        longitudeDelta: 0.06})
    }
    
  }, [cordinates]);


  const [kmlFile, setKmlFile] = useState('');
//   const COORDINATES=
// [{latitude:37.8025259,longitude:-122.4351431},
//   {latitude:37.7896386,longitude:-122.421646},
//   {latitude:37.7665248,longitude:-122.4161628},
//   {latitude:37.7734153,longitude:-122.4577787},
//   {latitude:37.7948605,longitude:-122.4596065},
//   {latitude:37.8025259,longitude:-122.4351431}]


 
  const FindMyLocation=()=>{
    
   
    Geolocation.getCurrentPosition(location => {
      const coords=location.coords;
      console.log("coords ",coords)
      setPosition({
        latitude:coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.6,
        longitudeDelta: 0.6
      })
    });
  
   
  }
  const onPressLoadFile= async ()=>{
    try {
      const res = await Picker.pickSingle({
        type: [Picker.types.allFiles],

        
      });
      parseKmlFile(res)
      setKmlFile(res.uri)
    } catch (err) {
      //Handling any exception
      if (Picker.isCancel(err)) {
        //If user canceled the document selection
        alert('Canceled from single doc picker');
      } else {
        //For Unknown Error
        alert('Unknown Error: ' + JSON.stringify(err));
        throw err;
      }
    }
  }


 const parseKmlFile=async (res)=>{


  
  //const parsedKML = await RNFS.readFile(res.uri)
   const file =  await fs.readFile(res.uri,'utf8')
   //parseDocument(file) 
   const a = await extractGoogleCoords(file)
   
   //const doc = new DOMParser().parseFromString(file)
   console.log("extractGoogleCoords ;",a)

   setCordinates(a.polygons)
  

}

const isInsidePoly = (lat, lon, polygon) => {

  let px = lat,py = lon;
  
  let x1,y1,x2,y2;
  let minDistance=0;

  let inside = false;

  if(typeof polygon === 'undefined'){
    Alert.alert('you dont have the polygon', 'You must import the kml file first')
     return;
  }
  for(let i=0 ; i<polygon[0].length; i++){
    console.log("polygon[i]",polygon[0][i])
     x1=polygon[0][i].latitude;
      y1 = polygon[0][i].longitude;
    if(i+1<polygon[0].length){
       x2 = polygon[0][i+1].latitude;
       y2 = polygon[0][i+1].longitude;
    }
    else
      {
         x2 = polygon[0][0].latitude;
         y2 = polygon[0][0].longitude;
      }
      if((x1==px) && (y1 == py) || (x2==px) && (y2 == py) ){
        Alert.alert("Polygon location","your location is on one of the polygon's vertex")
        return;
      }
      if( ((y1 > py) != (y2 > py)) && (px == (x2 - x1) * (py - y1) / (y2 - y1) + x1)){
        Alert.alert("Polygon location","your location is on one of the polygon's side")
      }
      else{
        var intersect = ((y1 > py) != (y2 > py))
        && (px < (x2 - x1) * (py - y1) / (y2 - y1) + x1);
        if (intersect) inside = !inside;
      }
      if(minDistance==0)
        minDistance=distance(x1,y1,x2,y2,px,py)
      else{
        let dist=distance(x1,y1,x2,y2,px,py)
        if(minDistance>dist)
           minDistance=dist
      }  
    }
    if(inside)
     Alert.alert("Polygon location","your location is inside the polygon")
    else
    {
      Alert.alert("your location is outside the polygon","the minDistance to getting to the polygon location is "+minDistance)
    }
     
       

  }

  const distance = (x1,y1,x2,y2,px,py)=>{
    //y-y1=m(x-x1)
    //0=m(x-x1)-y+y1
    //m=(y2-y1)/(x2-x1)
    //ax+by+c=0
    //d=(abs(a(px)+b(py)+c)/sqrt((a^2)+(b^2)))

    let m =((y2-y1)/(x2-x1))//M
    
    let a=m*(-x1)
    let c=a+y1
    let b=-1  

    let distance=((Math.abs(a*(px)+b*(py)+c))/(Math.sqrt((Math.pow(a,2))+(Math.pow(b,2)))))
    console.log("distance   "+distance)
    return distance
    
  }
  


 const extractGoogleCoords= async (plainText)=> {
  
  let xmlDoc = new DOMParser().parseFromString(plainText)
  let googlePolygons = []
  let googleMarkers = []

  if (xmlDoc.documentElement.nodeName == "kml") {
   const placeMarks=await xmlDoc.getElementsByTagName('Placemark');
  
     for(let i=0;i<placeMarks.length; i++){
     let item=placeMarks[i] 
      let polygons = item.getElementsByTagName('Polygon')
      let markers = item.getElementsByTagName('Point')

        for(let j=0;j<polygons.length; j++){
          const polygon =polygons[j]
        let coords = polygon.getElementsByTagName('coordinates')[0].childNodes[0].nodeValue.trim()
        let points = coords.split(" ")

        let googlePolygonsPaths = []
        for (const point of points) {
          let coord = point.split(",")
          if(coord[1]&&coord[0])
          googlePolygonsPaths.push({ latitude: +coord[1], longitude: +coord[0] })
        }
        console.log("googlePolygonsPaths   : ",googlePolygonsPaths)
        googlePolygons.push(googlePolygonsPaths)
      }
        for(let j=0; j<markers.length; j++){
          const marker=markers[j]
        var coords = marker.getElementsByTagName('coordinates')[0].childNodes[0].nodeValue.trim()
        let coord = coords.split(",")
        googleMarkers.push({ latitude: +coord[1], longitude: +coord[0] })
      }
    }
  } else {
    throw "error while parsing"
  }
  return { markers: googleMarkers, polygons: googlePolygons }

}

  return (
    <>
       <Button
  onPress={onPressLoadFile}
  title="Import KML File"
  color="#841584"
  accessibilityLabel="Learn more about this purple button"
/>
    <View style={styles.container}>
      <MapView style={styles.map} 
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
        showsCompass={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        region={region}
         >
      {/* {cordinates.map((polygon)=>{
        {console.log("polygonMAp ",polygon)} */}
        {cordinates&&
        <Polyline
        coordinates={cordinates[0]}
        strokeColor={"red"}
        strokeWidth={6}
        >
          

      </Polyline>
     }
      {/* })} */}
      <Marker
       title='I am here'
       description='This is a description'
       coordinate={position}/>
      </MapView>
      
    </View>
    <Button title='Find my location' onPress={FindMyLocation}></Button>
    <Button title='Where am I distance the polygon' onPress={()=>isInsidePoly(position.latitude,position.longitude,cordinates)}></Button>
    </>
 



  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});



export default MainScreen;
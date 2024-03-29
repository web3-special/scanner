import React, { Component } from 'react';
import { Text, View, Image, Modal, Alert } from 'react-native';
import { Button } from 'react-native-elements';
import { RNCamera } from 'react-native-camera';
import { GET } from '../utils/functions';
import { styles } from './scanner_style';

const icon = require('../../images/logo.png');
const loaderimage = require('../../images/loaderImage.png');
const unhealthyimage = require('../../images/unhealthyimage.png');
const healthyimage = require('../../images/healthyimage.png');
// const scnnerImage = require('../../images/scnnerImage.png');

const FONT_NAME = 'AvenirNext-Regular';

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // torchMode: 'off',
      // cameraType: 'back',
      barcode: '',
      showCamera: false,
      loading: false,
      result: ''
    };
  }

  barcodeReceived(e) {
    console.log(`Barcode: ${e.data}`);
    console.log(`Type: ${e.type}`);
  }

  renderLoader() {
    const { barcode } = this.state;
    return (
      <View style={styles.mainContainer}>
        <Text style={styles.textContentAreaTitle}>{barcode}</Text>
        <View style={styles.sliderItemContainer}>
          <Image
            source={loaderimage}
            style={styles.loaderimage}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  }

  renderResult() {
    const { result } = this.statel;
    const { healthy, message } = result;

    const mainstyle = {
      ...styles.mainContainer,
      backgroundColor: healthy ? '#85bf43' : '#eb8c30'
    };
    const textstyle = { ...styles.textContentAreaTitle, color: 'white' };
    const image = healthy ? healthyimage : unhealthyimage;

    return (
      <View style={mainstyle}>
        <View style={styles.sliderItemContainer}>
          <Image
            source={image}
            style={styles.loaderimage}
            resizeMode="contain"
          />
          <Text style={textstyle}>{message}</Text>
        </View>
        <Button
          buttonStyle={styles.button}
          onPress={() => {
            this.setState({ showCamera: false, loading: false, result: null });
          }}
          rounded
          large
          backgroundColor={!healthy ? '#85bf43' : '#eb8c30'}
          title="Check Another Product"
          textStyle={styles.buttonText}
        />
      </View>
    );
  }

  renderCamera() {
    const { showCamera, barcode } = this.state;
    return (
      <View style={styles.container}>
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.on}
          permissionDialogTitle="Permission to use camera"
          permissionDialogMessage="We need your permission to use your camera phone"
          onBarCodeRead={barcodes => {
            console.log(barcodes);
            if (showCamera) {
              this.setState(
                { barcode: barcodes.data, showCamera: false },
                () => {
                  this.fetchData();
                }
              );
            }
          }}
          onGoogleVisionBarcodesDetected={({ barcodes }) => {
            console.log(barcodes);
          }}
        />

        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }}
        >
          <View
            style={{
              flex: 1,
              alignSelf: 'stretch',
              backgroundColor: '#000',
              opacity: 0.5
            }}
          />
          <View style={{ flex: 1, alignSelf: 'stretch' }} />

          <View
            style={{
              flex: 1,
              alignSelf: 'stretch',
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: 32,
              flexDirection: 'column',
              backgroundColor: 'rgba(0,0,0,0.5)'
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'normal',
                fontFamily: FONT_NAME,
                color: 'white',
                marginBottom: 20
              }}
            >
              {barcode ? 'Barcode Detected' : 'Scan Barcode'}
            </Text>
            {barcode.length > 0 && (
              <Text
                style={{
                  fontSize: 20,
                  color: 'white',
                  margin: 8,
                  marginBottom: 16,
                  fontWeight: 'bold'
                }}
              >
                {barcode}
              </Text>
            )}

            <View
              style={{
                flex: 0,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                paddingBottom: 8
              }}
            >
              {barcode.length > 0 && (
                <Button
                  onPress={() => {
                    this.setState({ showCamera: false }, () => {
                      this.fetchData();
                    });
                  }}
                  rounded
                  backgroundColor="#85bf43"
                  title="CONTINUE"
                  textStyle={{
                    fontSize: 20,
                    color: '#ffffff',
                    fontWeight: 'normal',
                    fontFamily: FONT_NAME
                  }}
                />
              )}

              <Button
                onPress={() => {
                  this.setState({ showCamera: false });
                }}
                rounded
                large
                title="CANCEL"
                textStyle={[styles.buttonText, styles.buttonFontLarge]}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  fetchData = () => {
    this.setState({ loading: true });
    this.fetchIngredeants((food, error) => {
      if (food) {
        this.fetchResult(food.foodContentsLabel, (result, err, healthy) => {
          if (result) {
            this.setState({
              loading: false,
              result: { healthy, message: result }
            });
          } else {
            this.setState({ loading: false });
            setTimeout(() => {
              alert(err.message);
            }, 500);
          }
        });
      } else {
        this.setState({ loading: false });
        setTimeout(() => {
          alert(error.message);
        }, 500);
      }
    });
  };

  fetchIngredeants = fnc => {
    const { barcode } = this.state;
    const url = `https://api.edamam.com/api/food-database/parser`;
    GET(
      url,
      {},
      {
        upc: barcode,
        app_id: 'c7547c4f',
        app_key: 'f799a9b249c3a96f17d715a58a31cac9'
      },
      (error, response) => {
        if (response) {
          const { hints } = response;
          if (hints && hints.length > 0) {
            const hint = hints[0];
            const { food } = hint;
            // const { label, foodContentsLabel } = food;
            fnc(food, error);
          } else {
            // console.log(`Error ${response}`);
            fnc(null, response);
          }
        } else {
          fnc(null, error);
        }
      }
    );
  };

  fetchResult = (ingredients, fnc) => {
    const url = `http://13.232.170.63/ing_app/public/api/v1/ingredients`;
    GET(
      url,
      {},
      {
        alt_names: ingredients,
        limit: 1,
        page: 1
      },
      (error, response) => {
        // debugger;
        if (response) {
          const { data, message } = response;
          if (data.length > 0) {
            const result = data[0];
            const { bad_reason: badReason } = result.attributes;
            fnc(badReason, error, false);
          } else {
            fnc(message, error, true);
          }
        } else {
          fnc(null, error, true);
        }
      }
    );
  };

  render() {
    const { loading, result, showCamera } = this.state;
    if (loading) {
      return this.renderLoader();
    }
    if (result) {
      return this.renderResult();
    }
    return (
      <View style={styles.mainContainer}>
        <View style={styles.sliderItemContainer}>
          <Image
            source={icon}
            style={styles.imageContentArea}
            resizeMode="contain"
          />
          <Text style={styles.textContentAreaTitle}>
            Take a photo and choose a photo of ingredients
          </Text>
        </View>
        <Button
          buttonStyle={styles.button}
          onPress={() => {
            // this.fetchData();
            this.setState({ showCamera: true, barcode: '' });
          }}
          rounded
          large
          backgroundColor="#85bf43"
          title="Take a photo"
          textStyle={[styles.buttonText, styles.buttonFontLarge]}
        />

        <Modal
          animationType="slide"
          transparent={false}
          visible={showCamera}
          onRequestClose={() => {
            Alert.alert('Modal has been closed.');
          }}
        >
          {this.renderCamera()}
        </Modal>
      </View>
    );
  }
}

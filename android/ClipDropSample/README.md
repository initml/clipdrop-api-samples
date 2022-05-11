# Clipdrop API Android Sample

![telegram-cloud-document-4-6044047144808090677](https://user-images.githubusercontent.com/1808854/167869037-84e9fda9-2e05-465e-ab7d-839194e2d8d4.gif)


## Initialization

- An API key **must** be set to compile the sample in your **`local.propreties`** file :
``` 
apiKey="YOUR API KEY HERE"
```

## Architecture

- Kotlin
- Single App Activity 
- Dependancies
  - CameraX 
  - OkHttp 

## Flow

**1) Show Camera**
- Request Permissions 
- Camera Initialization 

**2) API Request**
- Get an Image Capture threw CameraX
- Process the bitmap with the api : [full process here](https://clipdrop.co/apis/docs/remove-background)
- Get a Bitmap with the result

**3) Show Result / Share**
- The result is shown in an ImageView
- Can be shared via a simple Intent

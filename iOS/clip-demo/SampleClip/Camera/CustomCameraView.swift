//
//  ContentView.swift
//  SwiftUI-CameraApp
//
//  Created by Gaspard Rosay on 28.01.20.
//  Copyright © 2020 Gaspard Rosay. All rights reserved.
//

import SwiftUI
import Alamofire

extension CustomCameraView {
  @MainActor class ViewModel: ObservableObject {

    @Published var shouldShowOverlay = false
    @Published var isSharePresented = false
    @Published var imageProcessed: UIImage?
    @Published var showProgress = false

    @Published var originalImage: UIImage?

    @Published var errorOcurred = false
    @Published var errorText = Text("")
    @Published var error: Error?


    func retake() {
      shouldShowOverlay = false
      imageProcessed = nil
    }

    func share() {
      isSharePresented = true
    }

    func clip() {
      NotificationCenter.default.post(name: Notification.Name("capturePhoto"), object: nil)
    }

    func uploadImageToClip(image: UIImage) {
      showProgress = true

      let imageData = image.jpegData(compressionQuality: 0.9)!

      let headers: HTTPHeaders = [
        "x-api-key": "7ec132c33b823ef08fbbde76b3d1745cfe27b5f7521d1831b73f761b910c0a15919217e3caab8944a6283e9225ecf5cd "
      ]

      AF.upload(
        multipartFormData: { multipartFormData in
          multipartFormData.append(
            imageData,
            withName: "image_file",
            fileName: "object.jpg",
            mimeType: "image/jpeg"
          )
        },
        to: "https://matting-dev-2fjujhplza-ez.a.run.app/",
        headers: headers
      )
      .responseData(queue: .global()) { response in

        Task { @MainActor in
          switch response.result {
          case .success: do {
            if let imageReceived = UIImage.init(data: response.data!) {
              self.imageProcessed = imageReceived
              self.showProgress = false
              self.shouldShowOverlay = true
            } else {
              print(response)
            }
          }
          case let .failure(error):
            self.error = error
            self.errorText = Text(error.localizedDescription)
            self.showProgress = false
            self.errorOcurred = true
          }
        }
      }
    }
  }
}

struct CustomCameraView: View {
  @StateObject private var viewModel = ViewModel()

  let pub = NotificationCenter.default
    .publisher(for: NSNotification.Name("imageCaptured"))

  var body: some View {

    ZStack(alignment: .topTrailing) {

      Spacer().frame(height: 0)
        .alert(isPresented: $viewModel.errorOcurred, content: {
          Alert(title: Text("api.error.genericCode"), message: viewModel.errorText, dismissButton: .default(Text("alert.okbutton"), action: {
            print("actionnn")
          }))
        })

      Spacer().frame(height:0)
        .sheet(isPresented: $viewModel.isSharePresented, onDismiss: {
          viewModel.isSharePresented = false
        }, content: {
          ActivityViewController(activityItems: [viewModel.imageProcessed as Any])
        })

      ZStack {
        CameraViewController()
          .overlay(
            ZStack {
              Image(uiImage: viewModel.originalImage ?? UIImage())
                .resizable()
                .scaledToFill()
                .hidden(!viewModel.showProgress)

              if let image = viewModel.imageProcessed {
                Image(uiImage: image)
                  .resizable()
                  .scaledToFill()
                  .background(Color.black.opacity(0.4))
              }

              VStack {
                Spacer()

                if !viewModel.shouldShowOverlay {
                  Button {
                    viewModel.clip()
                  } label: {
                    Text("Clip")
                      .font(.body)
                      .bold()
                      .lineLimit(1)
                      .minimumScaleFactor(0.5)
                      .frame(minWidth: 0, maxWidth: 300)
                      .frame(minHeight: 60)
                      .foregroundColor(.black)
                      .background(Color.white)
                      .cornerRadius(15)
                  }

                  .padding(.bottom, 40)
                  .padding(.horizontal, 20)
                  .disabled(viewModel.showProgress)
                } else {
                  HStack {
                    Button {
                      viewModel.retake()
                    } label: {
                      Text("Retake")
                        .font(.body)
                        .bold()
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                        .frame(minWidth: 0, maxWidth: 150)
                        .frame(minHeight: 60)
                        .foregroundColor(.white)
                        .background(Color.gray)
                        .cornerRadius(15)
                    }

                    Button {
                      viewModel.share()
                    } label: {
                      Text("Share")
                        .font(.body)
                        .bold()
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                        .frame(minWidth: 0, maxWidth: 150)
                        .frame(minHeight: 60)
                        .foregroundColor(.white)
                        .background(Color.blue)
                        .cornerRadius(15)
                    }
                  }
                  .padding(.horizontal, 20)
                  .padding(.bottom, 40)
                }
              }
            }
          )
          .overlay(
            ProgressView("")
              .progressViewStyle(CircularProgressViewStyle(tint: .white))
              .scaleEffect(1.5, anchor: .center)
              .hidden(!viewModel.showProgress)
              .animation(.easeInOut(duration: 0.2))
          )
          .onReceive(pub, perform: { notif in
            if let image = notif.object as? UIImage {
              viewModel.originalImage = image
              let resizeImage = image.resizeToResolution(resolution: 720)
              viewModel.uploadImageToClip(image: resizeImage ?? UIImage())
            }
          })
      }

    }
    .navigationBarTitle("")
    .navigationBarHidden(true)
    .edgesIgnoringSafeArea(.all)
  }
}


//
//  WrappedView.swift
//  SampleClip
//
//  Created by Romain Boyer on 15/04/2022.
//

import Foundation
import SwiftUI

struct ActivityViewController: UIViewControllerRepresentable {

  var activityItems: [Any]
  var applicationActivities: [UIActivity]?

  func makeUIViewController(context: UIViewControllerRepresentableContext<ActivityViewController>) -> UIActivityViewController {
    let controller = UIActivityViewController(activityItems: activityItems, applicationActivities: applicationActivities)
    return controller
  }

  func updateUIViewController(_ uiViewController: UIActivityViewController, context: UIViewControllerRepresentableContext<ActivityViewController>) {}

}

//
//  View+Extension.swift
//  SampleClip
//
//  Created by Romain Boyer on 14/04/2022.
//

import Foundation
import SwiftUI

extension View {
  func hidden(_ shouldHide: Bool) -> some View {
    opacity(shouldHide ? 0 : 1)
  }
}

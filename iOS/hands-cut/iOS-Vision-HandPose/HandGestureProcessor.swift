/*
See LICENSE folder for this sample’s licensing information.

Abstract:
This class is a state machine that transitions between states based on pair
    of points stream. These points are the tips for thumb and index finger.
    If the tips are closer than the desired distance, the state is "pinched", otherwise it's "apart".
    There are also "possiblePinch" and "possibeApart" states that are used to smooth out state transitions.
    During these possible states HandGestureProcessor collects the required amount of evidence before committing to a definite state.
*/

import CoreGraphics
// MARK: - CGPoint helpers

extension CGPoint {

    static func midPoint(p1: CGPoint, p2: CGPoint) -> CGPoint {
        return CGPoint(x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2)
    }
    
    func distance(from point: CGPoint) -> CGFloat {
        return hypot(point.x - x, point.y - y)
    }
}


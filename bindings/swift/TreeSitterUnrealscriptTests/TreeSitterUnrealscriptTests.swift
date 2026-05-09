import XCTest
import SwiftTreeSitter
import TreeSitterUnrealscript

final class TreeSitterUnrealscriptTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_unrealscript())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading UnrealScript grammar")
    }
}

package tree_sitter_unrealscript_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_unrealscript "github.com/shrimpza/tree-sitter-unrealscript/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_unrealscript.Language())
	if language == nil {
		t.Errorf("Error loading UnrealScript grammar")
	}
}
